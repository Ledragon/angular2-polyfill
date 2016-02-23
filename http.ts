import {Inject} from './core';

export interface RequestOptionsArgs {
	params?: string | any;
	data?: string | any;
	headers?: any;
	xsrfHeaderName?: string;
	xsrfCookieName?: string;
	transformRequest?: Function | Function[];
	transformResponse?: Function | Function[];
	paramSerializer?: string | Function;
	cache?: boolean | any;
	timeout?: number | Promise<any>;
	withCredentials?: boolean;
	responseType?: string;
}

export interface Response {
	data: string | any;
	status: number;
	headers: Function;
	config: RequestOptionsArgs;
	statusText: string;
}

export class Http {

	// Inject good old `$http`
	constructor(@Inject('$http') private http) {

	}

	// // TODO IMPLEMENT
	// request(url: string | Request, options?: RequestOptionsArgs): Promise<Response> {
	//
	// }

	get(url: string, options?: RequestOptionsArgs): Promise<Response> {
		return this.http.get(url, options);
	}

	post(url: string, body: any, options?: RequestOptionsArgs): Promise<Response> {
		return this.http.post(url, body, options);
	}

	put(url: string, body: any, options?: RequestOptionsArgs): Promise<Response> {
		return this.http.put(url, body, options);
	}

	delete(url: string, options?: RequestOptionsArgs): Promise<Response> {
		return this.http.delete(url, options);
	}

	patch(url: string, body: any, options?: RequestOptionsArgs): Promise<Response> {
		return this.http.patch(url, body, options);
	}

	head(url: string, options?: RequestOptionsArgs): Promise<Response> {
		return this.http.head(url, options);
	}
}

// Export the providers
export const HTTP_PROVIDERS = [Http];
