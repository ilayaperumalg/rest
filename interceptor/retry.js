/*
 * Copyright (c) 2012 VMware, Inc. All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

(function (define) {

	define(function (require) {
		"use strict";

		var interceptor, when, delay;

		interceptor = require('../interceptor');
		when = require('when');
		delay = require('when/delay');

		/**
		 * Retries a rejected request using an exponential backoff.
		 *
		 * Defaults to an initial interval of 100ms, a multiplier of 2, and no max interval.
		 *
		 * @param {Client} [client] client to wrap
		 * @param {Number} [config.intial=100] initial interval in ms
		 * @param {Number} [config.multiplier=2] interval multiplier
		 * @param {Number} [config.max] max interval in ms
		 *
		 * @returns {Client}
		 */
		return interceptor({
			request: function (request, config) {
				request.retry = request.retry || config.initial || 100;
				return request;
			},
			error: function (response, config, client) {
				var request, multiplier, max, sleep;

				request = response.request;
				multiplier = config.multiplier || 2;
				max = config.max || Infinity;
				sleep = Math.min(request.retry, request.retry *= multiplier, max);

				return delay(request, sleep).then(function (request) {
					if (request.canceled) {
						// cancel here in case client doesn't check canceled flag
						return when.reject({ request: request, error: 'precanceled' });
					}
					return client(request);
				});
			}
		});
	});

}(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
));