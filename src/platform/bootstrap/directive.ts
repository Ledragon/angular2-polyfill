import * as angular from 'angular';
import * as camelcase from 'camelcase';
import * as dotProp from 'dot-prop';
import * as utils from './utils';

function parseSelector(selector: string) {
	const regex = [
		// {key: 'E', value: /^([a-zA-Z])$/},
		{key: 'A', value: /^\[([a-zA-Z]+)\]$/},
		{key: 'C', value: /^\.([a-zA-Z]+)$/}
	];

	for (let i = 0; i < regex.length; i++) {
		const result = selector.match(regex[i].value);

		if (result !== null) {
			return {restrict: regex[i].key, name: result[1]};
		}
	};

	throw new Error(`Selector ${selector} could not be parsed`);
}

function parseHostBinding(key: string) {
	const regex = [
		{type: 'attr', regex: /^([a-zA-Z]+)$/},
		{type: 'prop', regex: /^\[([a-zA-Z\.]+)\]$/},
		{type: 'event', regex: /^\(([a-zA-Z]+)\)$/}
	];

	for (let i = 0; i < regex.length; i++) {
		const match = key.match(regex[i].regex);

		if (match !== null) {
			return {type: regex[i].type, value: match[1]};
		}
	};
}

function parseHosts(hostBindings: {string: string}[]) {
	const result = {
		attrs: {},
		events: {},
		props: {}
	};

	Object.keys(hostBindings).forEach(key => {
		const value = hostBindings[key];
		const parsed = parseHostBinding(key);

		if (parsed.type === 'attr') {
			result.attrs[parsed.value] = value;
		} else if (parsed.type === 'event') {
			const handler = value.match(/^([a-zA-Z]+)\((.*?)\)$/);

			const method = handler[1];
			const params = handler[2].length === 0 ? [] : handler[2].split(/,[ ]*/);

			result.events[parsed.value] = {method, params};
		} else if (parsed.type === 'prop') {
			result.props[value] = result.props[value] || [];
			result.props[value].push(parsed.value);
		}
	});

	return result;
}

export function bootstrap(ngModule, target) {
	const annotations = target.__annotations__;
	const directive = annotations.directive;

	const selector = parseSelector(directive.selector);
	const hostBindings = parseHosts(directive.host || {});

	// Inject the services
	utils.inject(target);

	ngModule
		.controller(target.name, target)
		.directive(selector.name, [() => {
			const declaration: any = {
				restrict: selector.restrict,
				scope: {},
				bindToController: {},
				controller: target.name,
				controllerAs: 'ctrl',
				link: (scope, el) => {
					// Handle attributes
					Object.keys(hostBindings.attrs).forEach(attribute => {
						el.attr(attribute, hostBindings.attrs[attribute]);
					});

					// Handle host listeners
					Object.keys(hostBindings.events).forEach(event => {
						const target = hostBindings.events[event];

						el.bind(event, e => {
							const ctx = {$event: e};
							// use scope.$apply because we are outside the angular digest cycle
							scope.$apply(() => {
								scope.ctrl[target.method].apply(scope.ctrl, target.params.map(param => dotProp.get(ctx, param)));
							});
						});
					});

					// Handle host property bindings
					Object.keys(hostBindings.props).forEach(property => {
						const bindings = hostBindings.props[property];

						scope.$watch(`ctrl.${property}`, newValue => {
							const value = Boolean(newValue);

							bindings.forEach(binding => {
								const splitted = binding.split('.');

								if (splitted.length === 1) {
									// Set the property directly
									el.prop(binding, value);
								} else {
									const root = splitted.shift();

									if (root === 'class') {
										// Handle adding/removing class names
										const method = value ? 'addClass' : 'removeClass';
										el[method](splitted.join('.'));
									} else {
										// Handle deeply nested properties
										let runner = el.prop(root);
										while (splitted.length > 1) {
											runner = runner[splitted.shift()];
										}
										runner[splitted.shift()] = value;
									}
								}
							});
						});
					});
				}
			};

			// Bind inputs and outputs
			utils.bindInput(target, declaration);
			utils.bindOutput(target, declaration);

			return declaration;
		}]);
}
