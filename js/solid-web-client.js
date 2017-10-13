(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.SolidWebClient = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'
/**
 * Provides a simple configuration object for Solid web client
 * @module config-default
 */
module.exports = {
  /**
   * Default proxy URL for servicing CORS requests
   */
  proxyUrl: 'https://databox.me/,proxy?uri={uri}',
  /**
   * Timeout for web/ajax operations, in milliseconds
   */
  timeout: 50000
}

},{}],2:[function(require,module,exports){
'use strict';
/**
 * Provides a Solid web client class for performing LDP CRUD operations.
 * @module web
 */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEFAULT_ACCEPT = 'text/turtle;q=0.8,*/*;q=0.5';
var DEFAULT_MIME_TYPE = 'text/turtle';
var defaultConfig = require('../config-default');

var composePatchQuery = require('./util/web-util').composePatchQuery;
var SolidResponse = require('./models/response');
var XMLHttpRequest = require('./util/xhr');
var HttpError = require('standard-http-error');
var vocab = require('solid-namespace');

/**
 * Provides a collection of Solid/LDP web operations (CRUD)
 * @class SolidWebClient
 */

var SolidWebClient = function () {
  /**
   * @constructor
   * @param rdf {RDF} RDF library (like rdflib.js or rdf-ext) for parsing
   * @param [config={}] {Object} Config hashmap
   * @param [config.auth] {ClientAuthOIDC} Solid OIDC auth client instance
   */
  function SolidWebClient(rdf) {
    var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, SolidWebClient);

    this.rdf = rdf;
    this.vocab = vocab(rdf);
    this.config = Object.assign({}, defaultConfig, config);
    this.auth = config.auth;
  }

  /**
   * Creates a Solid container with the specified name.
   * Uses PUT instead of POST to guarantee the container name (and uses
   * conditional HTTP headers to fail with a `409 Conflict` error if
   * a container with that name already exists).
   *
   * @method createContainer
   * @param parentUrl {string} Parent directory/container in which to create
   * @param name {string} Container name (slug / URL fragment), no trailing
   *   slash needed.
   * @param [options] {Object} Options hashmap (optional, see `solidRequest()`)
   * @param [data] {string} Optional RDF data payload (additional triples
   *   that will be added to the container's metadata)
   *
   * @throws {HttpError} Throws an error if a resource or container with the
   *   same name already exists
   *
   * @return {Promise<SolidResponse>}
   */


  _createClass(SolidWebClient, [{
    key: 'createContainer',
    value: function createContainer(parentUrl, name, options, data) {
      return this.post(parentUrl, data, name, true);
    }

    /**
     * Creates and returns the appropriate Solid wrapper for the XHR response.
     *
     * @method createResponse
     * @param xhrResponse {XMLHttpRequest} XHR Response
     * @param method {string} HTTP verb
     *
     * @return {SolidResponse} A SolidResponse
     */

  }, {
    key: 'createResponse',
    value: function createResponse(xhrResponse, method) {
      return new SolidResponse(this.rdf, xhrResponse, method);
    }

    /**
     * Returns the current window's location (for use with `needsProxy()`)
     * if used in browser, or `null` if used from Node.
     *
     * @method currentUrl
     *
     * @return {string|null}
     */

  }, {
    key: 'currentUrl',
    value: function currentUrl() {
      if (typeof window !== 'undefined') {
        return window.location.href;
      } else {
        return null;
      }
    }

    /**
     * Deletes an existing resource or container.
     *
     * @method del
     * @param url {string} URL of the resource or container to be deleted
     *
     * @return {Promise<SolidResponse>} Result of the HTTP Delete operation
     *   (true on success, or an anonymous error object on failure)
     */

  }, {
    key: 'del',
    value: function del(url) {
      return this.solidRequest(url, 'DELETE');
    }

    /**
     * Retrieves a resource or container by making an HTTP GET call.
     *
     * @method get
     * @param url {string} URL of the resource or container to fetch
     * @param [options={}] {Object} Options hashmap (see `solidRequest()` docs)
     *
     * @return {Promise<SolidResponse>} Result of the HTTP
     *   GET operation, or an error object
     */

  }, {
    key: 'get',
    value: function get(url) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      options.headers = options.headers || {};

      // If no explicit Accept: header specified, set one
      if (!options.headers['Accept']) {
        options.headers['Accept'] = DEFAULT_ACCEPT;
      }

      return this.solidRequest(url, 'GET', options);
    }

    /**
     * Checks to see if a Solid resource exists, and returns useful resource
     *   metadata info.
     *
     * @method head
     * @param url {string} URL of a resource or container
     * @param [options] Options hashmap (see `solidRequest()` docs)
     *
     * @return {Promise} Result of an HTTP HEAD operation (returns a meta object)
     */

  }, {
    key: 'head',
    value: function head(url, options) {
      return this.solidRequest(url, 'HEAD', options);
    }

    /**
     * Loads a list of given RDF graphs via an async `Promise.all()`,
     * which resolves to an array of uri/parsed-graph hashes.
     *
     * @method loadParsedGraphs
     * @param locations {Array<string>} Array of graph URLs to load
     * @param [options] Options hashmap (see `solidRequest()` docs)
     *
     * @return {Promise<Array<Object>>}
     */

  }, {
    key: 'loadParsedGraphs',
    value: function loadParsedGraphs(locations, options) {
      var _this = this;

      var loadPromises = locations.map(function (location) {
        var responseUrl = void 0; // may differ from location if redirected

        return _this.get(location, options).then(function (response) {
          responseUrl = response.url;
          return response.parsedGraph();
        }).catch(function () {
          // Suppress the error, no need to reject, just return null graph
          return null;
        }).then(function (parsedGraph) {
          return {
            uri: responseUrl,
            value: parsedGraph
          };
        });
      });

      return Promise.all(loadPromises);
    }

    /**
     * Determines whether the web client needs to fall back onto a Proxy url,
     * to avoid being blocked by CORS
     *
     * @method needsProxy
     * @param url {string}
     *
     * @return {Boolean}
     */

  }, {
    key: 'needsProxy',
    value: function needsProxy(url) {
      var currentUrl = this.currentUrl();
      var currentIsHttps = currentUrl && currentUrl.slice(0, 6) === 'https:';
      var targetIsHttp = url && url.slice(0, 5) === 'http:';

      return currentIsHttps && targetIsHttp;
    }

    /**
     * Issues an HTTP OPTIONS request. Useful for discovering server capabilities
     * (`Accept-Patch:`, `Updates-Via:` for websockets, etc).
     * @method options
     * @param url {string} URL of a resource or container
     * @return {Promise<SolidResponse>} Result of an HTTP OPTIONS operation
     */

  }, {
    key: 'options',
    value: function options(url) {
      return this.solidRequest(url, 'OPTIONS');
    }

    /**
     * Partially edits an RDF-type resource by performing a PATCH operation.
     *   Accepts arrays of individual statements (in Turtle format) as params.
     *   For example:
     *   [ '<a> <b> <c> .', '<d> <e> <f> .']
     * @method patch
     * @param url {string} URL of the resource to be edited
     * @param toDel {Array<string>} Triples to remove from the resource
     * @param toIns {Array<string>} Triples to insert into the resource
     * @param [options] Options hashmap
     * @return {Promise<SolidResponse>} Result of PATCH operation
     */

  }, {
    key: 'patch',
    value: function patch(url, toDel, toIns, options) {
      var data = composePatchQuery(toDel, toIns);
      var mimeType = 'application/sparql-update';
      options = options || {};
      options.headers = options.headers || {};
      options.headers['Content-Type'] = mimeType;

      return this.solidRequest(url, 'PATCH', options, data);
    }

    /**
     * Creates a new resource by performing
     *   a Solid/LDP POST operation to a specified container.
     * @param url {string} URL of the container to post to
     * @param data {Object} Data/payload of the resource to be created
     * @param slug {string} Suggested URL fragment for the new resource
     * @param isContainer {Boolean} Is the object being created a Container
     *            or Resource?
     * @param mimeType {string} Content Type of the data/payload
     * @method post
     * @return {Promise<SolidResponse>} Result of XHR POST (returns parsed response
     *     meta object) or an anonymous error object with status code
     */

  }, {
    key: 'post',
    value: function post(url, data, slug, isContainer) {
      var mimeType = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : DEFAULT_MIME_TYPE;

      var resourceType = void 0;

      if (isContainer) {
        resourceType = this.vocab.ldp('BasicContainer');
        // Force the right mime type for containers only
        mimeType = 'text/turtle';
      } else {
        resourceType = this.vocab.ldp('Resource');
      }

      var options = {};
      options.headers = {};
      options.headers['Link'] = '<'+resourceType+'>' + '; rel="type"';
      options.headers['Content-Type'] = mimeType;

      if (slug && slug.length > 0) {
        options.headers['Slug'] = slug;
      }

      return this.solidRequest(url, 'POST', options, data);
    }

    /**
     * Turns a given URL into a proxied version, using a proxy template
     * @method proxyUrl
     * @param url {string} Intended URL
     * @param proxyUrlTemplate {string}
     * @return {string}
     */

  }, {
    key: 'proxyUrl',
    value: function proxyUrl(url, proxyUrlTemplate) {
      proxyUrlTemplate = proxyUrlTemplate || this.config.proxyUrl;
      return proxyUrlTemplate.replace('{uri}', encodeURIComponent(url));
    }

    /**
     * Updates an existing resource or creates a new resource by performing
     *   a Solid/LDP PUT operation to a specified container
     * @method put
     * @param url {string} URL of the resource to be updated/created
     * @param data {Object} Data/payload of the resource to be created or updated
     * @param [mimeType] {string} MIME Type of the resource to be created
     * @param [options={}] Options hashmap, see docs for `solidResponse()`
     * @return {Promise<SolidResponse>} Result of PUT operation (returns parsed
     *     response meta object if successful, rejects with an anonymous error
     *     status object if not successful)
     */

  }, {
    key: 'put',
    value: function put(url, data, mimeType) {
      var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

      options.headers = options.headers || {};
      mimeType = mimeType || DEFAULT_MIME_TYPE;
      options.headers['Content-Type'] = mimeType;

      return this.solidRequest(url, 'PUT', options, data);
    }

    /**
     * Sends a generic XHR request with the appropriate Solid headers,
     * and returns a promise that resolves to a parsed response.
     * @method solidRequest
     * @param url {string} URL of the request
     * @param method {string} HTTP Verb ('GET', 'PUT', etc)
     * @param [options] Options hashmap
     * @param [options.noCredentials=false] {Boolean} Don't use `withCredentials`
     * @param [options.forceProxy=false] {Boolean} Enforce using proxy URL if true
     * @param [options.headers={}] {Object} HTTP headers to send along
     *          with request
     * @param [options.proxyUrl=config.proxyUrl] {string} Proxy URL to use for
     *          CORS Requests.
     * @param [options.timeout=config.timeout] {Number} Request timeout in
     *          milliseconds.
     * @param [data] {Object} Optional data / payload
     * @throws {HttpError} Rejects with `httpError.HttpError` of the appropriate
     *   type
     * @return {Promise<SolidResponse>}
     */

  }, {
    key: 'solidRequest',
    value: function solidRequest(url, method, options, data) {
      options = options || {};
      options.headers = options.headers || {};

      if (this.auth && this.auth.accessToken) {
        options.headers['Authorization'] = 'Bearer ' + this.auth.accessToken;
      }

      options.proxyUrl = options.proxyUrl || this.config.proxyUrl;
      options.timeout = options.timeout || this.config.timeout;
      if (this.needsProxy(url) || options.forceProxy) {
        url = this.proxyUrl(url);
      }

      var client = this;

      return new Promise(function (resolve, reject) {
        var http = new XMLHttpRequest();

        http.open(method, url);
        if (!options.noCredentials) {
          http.withCredentials = true;
        }

        for (var header in options.headers) {
          // Add in optional headers
          http.setRequestHeader(header, options.headers[header]);
        }

        if (options.timeout) {
          http.timeout = options.timeout;
        }

        http.onload = function () {
          if (this.status >= 200 && this.status < 300) {
            resolve(client.createResponse(this, method));
          } else {
            reject(new HttpError(this.status, this.statusText, { xhr: this }));
          }
        };

        http.onerror = function () {
          reject(new HttpError(this.status, this.statusText, { xhr: this }));
        };
        if (typeof data === 'undefined' || !data) {
          http.send();
        } else {
          http.send(data);
        }
      });
    }
  }]);

  return SolidWebClient;
}();

/**
 * Returns a web client instance (convenience constructor method).
 * Usage:
 *
 *   ```
 *   var rdf = require('rdflib')  // or other compatible library
 *   var webClient = require('solid-web-client')(rdf)
 *   ```
 * @param rdf
 * @param config
 *
 * @return {SolidWebClient}
 */


function getClient(rdf, config) {
  return new SolidWebClient(rdf, config);
}

module.exports = getClient;
module.exports.SolidWebClient = SolidWebClient;
},{"../config-default":1,"./models/response":5,"./util/web-util":7,"./util/xhr":8,"solid-namespace":10,"standard-http-error":13}],3:[function(require,module,exports){
'use strict';
/**
 * @module container
 */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var graphUtil = require('../util/graph-util');
var parseLinks = graphUtil.parseLinks;
var vocab = require('solid-namespace');
var SolidResource = require('./resource');

/**
 * @class SolidContainer
 * @extends SolidResource
 * @constructor
 * @param rdf {RDF} RDF Library (such as rdflib.js) to inject
 * @param uri {string}
 * @param response {SolidResponse}
 */

var SolidContainer = function (_SolidResource) {
  _inherits(SolidContainer, _SolidResource);

  function SolidContainer(rdf, uri, response) {
    _classCallCheck(this, SolidContainer);

    /**
     * Hashmap of Containers within this container, keyed by absolute uri
     * @property containers
     * @type Object
     */
    var _this = _possibleConstructorReturn(this, (SolidContainer.__proto__ || Object.getPrototypeOf(SolidContainer)).call(this, rdf, uri, response));

    _this.containers = {};
    /**
     * List of URIs of all contents (containers and resources)
     * @property contentsUris
     * @type Array<string>
     */
    _this.contentsUris = [];
    /**
     * Hashmap of Contents that are just resources (not containers),
     * keyed by absolute uri
     * @property resources
     * @type Object
     */
    _this.resources = {};

    /**
     * Hashmap of common RDF ontology namespaces
     * @type Object
     */
    _this.vocab = vocab(rdf);

    if (_this.parsedGraph) {
      _this.appendFromGraph(_this.parsedGraph, _this.uri);
    }
    return _this;
  }

  /**
   * Extracts the contents (resources and sub-containers)
   * of the given graph and adds them to this container
   *
   * @method appendFromGraph
   * @param parsedGraph {Graph}
   * @param graphUri {string}
   */


  _createClass(SolidContainer, [{
    key: 'appendFromGraph',
    value: function appendFromGraph(parsedGraph, graphUri) {
      var _this2 = this;

      // Set this container's types
      var ns = this.vocab;
      var uriNode = this.rdf.namedNode(this.uri);
      this.types = Object.keys(parsedGraph.findTypeURIs(uriNode));

      // Extract all the contents links (resources and containers)
      var contentsUris = parseLinks(parsedGraph, null, ns.ldp('contains'));
      this.contentsUris = this.contentsUris.concat(contentsUris.sort());

      // Extract links that are just containers
      var containersLinks = parsedGraph.each(null, null, ns.ldp('Container'));

      var container = void 0;
      containersLinks.forEach(function (containerLink) {
        // Filter out . (the link to this directory)
        if (containerLink.uri !== _this2.uri) {
          container = new SolidContainer(_this2.rdf, containerLink.uri);
          container.types = Object.keys(parsedGraph.findTypeURIs(containerLink));
          _this2.containers[container.uri] = container;
        }
      });

      // Now that containers are defined, all the rest are non-container resources
      var isResource = void 0,
          isContainer = void 0;
      var resource = void 0,
          linkNode = void 0;
      contentsUris.forEach(function (link) {
        isContainer = link in _this2.containers;
        isResource = link !== _this2.uri && !isContainer;
        if (isResource) {
          resource = new SolidResource(_this2.rdf, link);
          linkNode = _this2.rdf.namedNode(link);
          resource.types = Object.keys(parsedGraph.findTypeURIs(linkNode));
          _this2.resources[link] = resource;
        }
      });
    }

    /**
     * Returns a list of SolidResource or SolidContainer instances that match
     * a given type.
     * @method findByType
     * @param rdfClass {string}
     * @return {Array<SolidResource|SolidContainer>}
     */

  }, {
    key: 'findByType',
    value: function findByType(rdfClass) {
      var matches = [];
      var key = void 0,
          container = void 0;

      for (key in this.containers) {
        container = this.containers[key];
        if (container.isType(rdfClass)) {
          matches.push(container);
        }
      }

      var resource = void 0;
      for (key in this.resources) {
        resource = this.resources[key];
        if (resource.isType(rdfClass)) {
          matches.push(resource);
        }
      }

      return matches;
    }

    /**
     * Is this a Container instance (vs a regular resource).
     * @return {Boolean}
     */

  }, {
    key: 'isContainer',
    value: function isContainer() {
      return true;
    }

    /**
     * Returns true if there are no resources or containers inside this container.
     * @method isEmpty
     * @return {Boolean}
     */

  }, {
    key: 'isEmpty',
    value: function isEmpty() {
      return this.contentsUris.length === 0;
    }
  }]);

  return SolidContainer;
}(SolidResource);

module.exports = SolidContainer;
},{"../util/graph-util":6,"./resource":4,"solid-namespace":10}],4:[function(require,module,exports){
'use strict';
/**
 * @module resource
 */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var graphUtil = require('../util/graph-util');

/**
 * Represents a Solid / LDP Resource (currently used when listing
 * SolidContainer resources)
 * @class SolidResource
 */

var SolidResource = function () {
  /**
   * @constructor
   * @param rdf {RDF}
   * @param uri {string}
   * @param response {SolidResponse}
   */
  function SolidResource(rdf, uri, response) {
    _classCallCheck(this, SolidResource);

    /**
     * Short name (page/filename part of the resource path),
     * derived from the URI
     * @property name
     * @type string
     */
    this.name = null;
    /**
     * Parsed graph of the contents of the resource
     * @property parsedGraph
     * @type Graph
     */
    this.parsedGraph = null;
    /**
     * Optional SolidResponse object from which this resource was initialized
     * @property response
     * @type SolidResponse
     */
    this.response = response;
    /**
     * List of RDF Types (classes) to which this resource belongs
     * @property types
     * @type Array<string>
     */
    this.types = [];
    /**
     * Absolute url of the resource
     * @property url
     * @type string
     */
    this.uri = uri;

    /**
     * RDF Library (such as rdflib.js) to inject (used for parsing contents)
     * @type RDF
     */
    this.rdf = rdf;

    if (response) {
      if (response.url !== uri) {
        // Override the given url (which may be relative) with that of the
        // response object (which will be absolute)
        this.uri = response.url;
      }
      this.initFromResponse(response);
    }
    this.initName();
  }

  /**
   * Initializes the short name from the url
   * @method initName
   */


  _createClass(SolidResource, [{
    key: 'initName',
    value: function initName() {
      if (!this.uri) {
        return;
      }

      // Split on '/', use the last fragment
      var fragments = this.uri.split('/');
      this.name = fragments.pop();

      if (!this.name && fragments.length > 0) {
        // URI ended in a '/'. Try again.
        this.name = fragments.pop();
      }
    }

    /**
     * @method initFromResponse
     * @param response {SolidResponse}
     */

  }, {
    key: 'initFromResponse',
    value: function initFromResponse(response) {
      var contentType = response.contentType();
      if (!contentType) {
        throw new Error('Cannot parse container without a Content-Type: header');
      }

      var parsedGraph = graphUtil.parseGraph(this.rdf, this.uri, response.raw(), contentType);
      this.parsedGraph = parsedGraph;

      this.types = Object.keys(parsedGraph.findTypeURIs(this.rdf.namedNode(this.uri)));
    }

    /**
     * Is this a Container instance (vs a regular resource).
     * (Is overridden in the subclass, `SolidContainer`)
     *
     * @return {Boolean}
     */

  }, {
    key: 'isContainer',
    value: function isContainer() {
      return false;
    }

    /**
     * Returns true if this a given type matches this resource's types
     * @method isType
     * @param rdfClass {string}
     * @return {Boolean}
     */

  }, {
    key: 'isType',
    value: function isType(rdfClass) {
      return this.types.indexOf(rdfClass) !== -1;
    }
  }]);

  return SolidResource;
}();

module.exports = SolidResource;
},{"../util/graph-util":6}],5:[function(require,module,exports){
'use strict';
/**
 * @module response
 */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var graphUtil = require('../util/graph-util'); // Used by .parsedGraph()
var SolidContainer = require('./container');
var SolidResource = require('./resource');
var webUtil = require('../util/web-util');

/**
 * Provides a wrapper around an XHR response object, and adds several
 * Solid-specific parsed fields (link headers, allowed verbs, etc)
 * @class SolidResponse
 */

var SolidResponse = function () {
  /**
   * @constructor
   * @param rdf {RDF} RDF Library such as rdflib.js
   * @param xhrResponse {XMLHttpRequest} Result of XHR operation
   * @param method {string} HTTP verb for the original request. Passed in
   *   separately because it's not actually stored in the XHR object.
   */
  function SolidResponse(rdf, xhrResponse, method) {
    _classCallCheck(this, SolidResponse);

    if (!xhrResponse) {
      this.xhr = null;
      this.user = '';
      this.method = null;
      this.types = [];
      this.graph = null;
      return;
    }
    /**
     * RDF Library such as rdflib.js. Used by parsedGraph()
     * @property rdf
     * @type RDF
     */
    this.rdf = rdf;
    /**
     * Hashmap of parsed `Link:` headers. Example:
     *
     *   ```
     *   {
     *     acl: [ 'resourceName.acl' ],
     *     describedBy: [ 'resourceName.meta' ],
     *     type: [
     *       'http://www.w3.org/ns/ldp#RDFResource',
     *       'http://www.w3.org/ns/ldp#Resource'
     *     ]
     *   }
     *   ```
     * @property linkHeaders
     * @type Object
     */
    var linkHeader = xhrResponse.getResponseHeader('Link');
    this.linkHeaders = webUtil.parseLinkHeader(linkHeader) || {};

    if (method) {
      method = method.toLowerCase();
    } else {
      method = '';
    }
    /**
     * HTTP verb for the original request (GET, PUT, etc)
     * @property method
     * @type string
     */
    this.method = method;

    /**
     * Name of the corresponding `.acl` resource
     * @property acl
     * @type string
     */
    this.acl = this.linkHeaders['acl'];
    if (this.acl) {
      this.acl = this.acl[0]; // Extract the single .acl link
    }
    /**
     * Hashmap of HTTP methods/verbs allowed by the server.
     * (If a verb is not allowed, it's not included.)
     * Example:
     *   ```
     *   {
     *     'get': true,
     *     'put': true
     *   }
     *   ```
     * @property allowedMethods
     * @type Object
     */
    this.allowedMethods = this.parseAllowedMethods(xhrResponse, method);

    /**
     * Cache of the parsed graph of xhr.response,
     * lazy-initialized when you call `response.parsedGraph()`
     * @property graph
     * @type {IndexedFormula}
     */
    this.graph = null;

    /**
     * Name of the corresponding `.meta` resource
     * @property meta
     * @type string
     */
    this.meta = this.linkHeaders['meta'] || this.linkHeaders['describedBy'];
    if (this.meta) {
      this.meta = this.meta[0]; // Extract the single .meta link
    }
    /**
     * LDP Types for the resource.
     * Example: [
     *   'http://www.w3.org/ns/ldp#Resource',
     *   'http://www.w3.org/ns/ldp#RDFResource'
     * ]
     * @property types
     * @type Array<string>
     */
    this.types = this.typeLinkHeaders();
    /**
     * URL of the resource created or retrieved
     * @property url
     * @type string
     */
    this.url = xhrResponse.getResponseHeader('Location') ? webUtil.absoluteUrl(webUtil.hostname(xhrResponse.responseURL), xhrResponse.getResponseHeader('Location')) : xhrResponse.responseURL;
    /**
     * WebID URL of the currently authenticated user (empty string if none)
     * @property user
     * @type string
     */
    this.user = xhrResponse.getResponseHeader('User') || '';
    /**
     * URL of the corresponding websocket instance, for this resource
     * Example: `wss://example.org/blog/hello-world`
     * @property websocket
     * @type string
     */
    this.websocket = xhrResponse.getResponseHeader('Updates-Via') || '';
    /**
     * Raw XHR response object
     * @property xhr
     * @type XMLHttpRequest
     */
    this.xhr = xhrResponse;

    /**
     * The resource which was returned by the XHR, if any.
     */
    this.resource = null;
    if (this.method === 'get') {
      this.resource = this.isContainer() ? new SolidContainer(this.rdf, this.url, this) : new SolidResource(this.rdf, this.url, this);
    }
  }

  /**
   * Returns the absolute URL of the ACL resource for this response.
   * @method aclAbsoluteUrl
   *
   * @return {string}
   */


  _createClass(SolidResponse, [{
    key: 'aclAbsoluteUrl',
    value: function aclAbsoluteUrl() {
      if (!this.acl) {
        return null;
      }

      return this.resolveMetaOrAclUrl('acl');
    }

    /**
     * Returns the Content-Type of the response (or null if no response
     * is present)
     * @method contentType
     *
     * @return {string|null}
     */

  }, {
    key: 'contentType',
    value: function contentType() {
      if (this.xhr) {
        return this.xhr.getResponseHeader('Content-Type').split(';')[0]; // remove parameter
      } else {
        return null;
      }
    }

    /**
     * Returns true if the resource exists (not a 404)
     * @method exists
     *
     * @return {Boolean}
     */

  }, {
    key: 'exists',
    value: function exists() {
      return this.xhr && this.xhr.status >= 200 && this.xhr.status < 400;
    }

    /**
     * Is this a Container instance (vs a regular resource)
     *
     * @return {Boolean}
     */

  }, {
    key: 'isContainer',
    value: function isContainer() {
      return this.isType('http://www.w3.org/ns/ldp#Container') || this.isType('http://www.w3.org/ns/ldp#BasicContainer');
    }

    /**
     * Returns true if the user is logged in with the server
     * @method isLoggedIn
     *
     * @return {Boolean}
     */

  }, {
    key: 'isLoggedIn',
    value: function isLoggedIn() {
      return this.user; // && this.user.slice(0, 4) === 'http'
    }

    /**
     * Returns true if this a given type matches this resource's types
     * @method isType
     *
     * @param rdfClass {string}
     *
     * @return {Boolean}
     */

  }, {
    key: 'isType',
    value: function isType(rdfClass) {
      return this.types.indexOf(rdfClass) !== -1;
    }

    /**
     * Returns the absolute URL of the .meta resource for this response.
     * @method metaAbsoluteUrl
     *
     * @return {string}
     */

  }, {
    key: 'metaAbsoluteUrl',
    value: function metaAbsoluteUrl() {
      if (!this.meta) {
        return null;
      }
      return this.resolveMetaOrAclUrl('meta');
    }

    /**
     * In case that this was preflight-type request (OPTIONS or POST, for example),
     * parses and returns the allowed methods for the resource (for the current
     * user).
     * @method parseAllowedMethods
     *
     * @param xhrResponse {XMLHttpRequest}
     * @param method {string} HTTP verb for the original request
     *
     * @return {Object} Hashmap of the allowed methods
     */

  }, {
    key: 'parseAllowedMethods',
    value: function parseAllowedMethods(xhrResponse, method) {
      if (method === 'get') {
        // Not a preflight request
        return {};
      } else {
        return webUtil.parseAllowedMethods(xhrResponse.getResponseHeader('Allow'), xhrResponse.getResponseHeader('Accept-Patch'));
      }
    }

    /**
     * Returns the parsed graph of the response (lazy-initializes it if it's not
     * present)
     * @method parsedGraph
     *
     * @return {Graph}
     */

  }, {
    key: 'parsedGraph',
    value: function parsedGraph() {
      if (!this.graph) {
        this.graph = graphUtil.parseGraph(this.rdf, this.url, this.raw(), this.contentType());
      }

      return this.graph;
    }

    /**
     * Returns the raw XHR response (or null if absent)
     * @method raw
     *
     * @return {Object|null}
     */

  }, {
    key: 'raw',
    value: function raw() {
      if (this.xhr) {
        return this.xhr.response;
      } else {
        return null;
      }
    }

    /**
     * Returns the absolute url of a "related" resource (.acl or .meta)
     *
     * @param propertyName {string} Either 'acl' or 'meta'
     *
     * @return {string|null}
     */

  }, {
    key: 'resolveMetaOrAclUrl',
    value: function resolveMetaOrAclUrl(propertyName) {
      if (!this.url) {
        return null;
      }

      var metaOrAclUrl = this[propertyName];
      // if url is https://example.com/resource, parent is https://example.com/
      var parentUrl = this.url.slice(0, this.url.lastIndexOf('/') + 1);

      return webUtil.absoluteUrl(parentUrl, metaOrAclUrl);
    }

    /**
     * Returns a unique (de-duplicated) list of `rel="type"` Link headers.
     *
     * @return {Array<string>}
     */

  }, {
    key: 'typeLinkHeaders',
    value: function typeLinkHeaders() {
      if (!Array.isArray(this.linkHeaders.type)) {
        return [];
      }
      var types = new Set(this.linkHeaders.type || []);

      return Array.from(types);
    }
  }]);

  return SolidResponse;
}();

module.exports = SolidResponse;
},{"../util/graph-util":6,"../util/web-util":7,"./container":3,"./resource":4}],6:[function(require,module,exports){
'use strict';
/**
 * Provides convenience methods for graph manipulation.
 * Currently depends on RDFLib
 * @module graph-util
 */

module.exports.appendGraph = appendGraph;
module.exports.parseGraph = parseGraph;
module.exports.parseLinks = parseLinks;
module.exports.serializeStatements = serializeStatements;
module.exports.graphFromStatements = graphFromStatements;

var ALL_STATEMENTS = null;

/**
 * Appends RDF statements from one graph object to another
 * @method appendGraph
 *
 * @param toGraph {Graph} Graph object to append to
 * @param fromGraph {Graph} Graph object to append from
 * @param docURI {string} Document URI to use as source
 */
function appendGraph(toGraph, fromGraph, docURI) {
  fromGraph.statementsMatching(ALL_STATEMENTS).forEach(function (st) {
    toGraph.add(st.subject, st.predicate, st.object, st.why);
  });
}

/**
 * Converts a list of RDF statements into a Graph, and returns
 * it.
 * @method graphFromStatements
 *
 * @param rdf {RDF} RDF library such as rdflib.js
 * @param statements {Array<Statement>}
 *
 * @return {Graph}
 */
function graphFromStatements(rdf, statements) {
  var graph = rdf.graph();

  statements.forEach(function (st) {
    graph.addStatement(st);
  });

  return graph;
}

/**
 * Parses a given graph, from text rdfSource, as a given content type.
 * Returns parsed graph.
 *
 * @method parseGraph
 * @param rdf {RDF} RDF library such as rdflib.js
 * @param baseUrl {string}
 * @param rdfSource {string} Text source code
 * @param contentType {string} Mime Type (determines which parser to use)
 *
 * @return {Graph}
 */
function parseGraph(rdf, baseUrl, rdfSource, contentType) {
  var parsedGraph = rdf.graph();

  rdf.parse(rdfSource, parsedGraph, baseUrl, contentType);

  return parsedGraph;
}

/**
 * Extracts the URIs from a parsed graph that match parameters.
 * The URIs are a set (duplicates are removed)
 * @method parseLinks
 *
 * @param graph {Graph}
 * @param subject {NamedNode}
 * @param predicate {NamedNode}
 * @param object {NamedNode}
 * @param source {NamedNode}
 *
 * @return {Array<string>} Array of link URIs that match the parameters
 */
function parseLinks(graph, subject, predicate, object, source) {
  var links = {};
  var matches = graph.statementsMatching(subject, predicate, object, source);
  matches.forEach(function (match) {
    links[match.object.uri] = true;
  });
  return Object.keys(links);
}

/**
 * Serializes an array of RDF statements into a simple N-Triples format
 * suitable for writing to a solid server.
 * @method serializeStatements
 *
 * @param statements {Array<Statement>} List of RDF statements
 *
 * @return {string}
 */
function serializeStatements(statements) {
  var source = statements.map(function (st) {
    return st.toNT();
  });
  source = source.join('\n');
  return source;
}
},{}],7:[function(require,module,exports){
'use strict';
/**
 * Provides misc utility functions for the web client
 * @module web-util
 */

module.exports.absoluteUrl = absoluteUrl;
module.exports.composePatchQuery = composePatchQuery;
module.exports.hostname = hostname;
module.exports.parseAllowedMethods = parseAllowedMethods;
module.exports.parseLinkHeader = parseLinkHeader;
module.exports.statementToNT = statementToNT;

/**
 * Return an absolute URL
 * @method absoluteUrl
 *
 * @param baseUrl {string} URL to be used as base
 * @param pathUrl {string} Absolute or relative URL
 *
 * @return {string}
 */
function absoluteUrl(baseUrl, pathUrl) {
  if (pathUrl && pathUrl.slice(0, 4) !== 'http') {
    return [baseUrl, pathUrl].map(function (path) {
      if (path[0] === '/') {
        path = path.slice(1);
      }
      if (path[path.length - 1] === '/') {
        path = path.slice(0, path.length - 1);
      }
      return path;
    }).join('/');
  }

  return pathUrl;
}

/**
 * Composes and returns a PATCH SPARQL query (for use with `web.patch()`)
 * @method composePatchQuery
 *
 * @param toDel {Array<string|Statement>} List of triples to delete
 * @param toIns {Array<string|Statement>} List of triples to insert
 *
 * @return {string} SPARQL query for use with PATCH
 */
function composePatchQuery(toDel, toIns) {
  var query = '';
  if (toDel && toDel.length > 0) {
    toDel = toDel.map(function (st) {
      return statementToNT(st);
    });
    query += 'DELETE DATA { ' + toDel.join(' ') + ' };\n';
  }

  if (toIns && toIns.length > 0) {
    toIns = toIns.map(function (st) {
      return statementToNT(st);
    });
    query += 'INSERT DATA { ' + toIns.join(' ') + ' };\n';
  }

  return query;
}

function hostname(url) {
  var protocol = void 0,
      hostname = void 0,
      result = void 0,
      pathSegments = void 0;
  var fragments = url.split('//');

  if (fragments.length === 2) {
    protocol = fragments[0];
    hostname = fragments[1];
  } else {
    hostname = url;
  }

  pathSegments = hostname.split('/');
  if (protocol) {
    result = protocol + '//' + pathSegments[0];
  } else {
    result = pathSegments[0];
  }

  if (url.startsWith('//')) {
    result = '//' + result;
  }

  return result;
}

/**
 * Extracts the allowed HTTP methods from the 'Allow' and 'Accept-Patch'
 * headers, and returns a hashmap of verbs allowed by the server
 * @method parseAllowedMethods
 *
 * @param allowMethodsHeader {string} `Access-Control-Allow-Methods` response
 *   header
 * @param acceptPatchHeader {string} `Accept-Patch` response header
 *
 * @return {Object} Hashmap of verbs (in lowercase) allowed by the server for
 *   the current user. Example:
 *   ```
 *   {
 *     'get': true,
 *     'put': true
 *   }
 *   ```
 */
function parseAllowedMethods(allowMethodsHeader, acceptPatchHeader) {
  var allowedMethods = {};

  if (allowMethodsHeader) {
    var verbs = allowMethodsHeader.split(',');
    verbs.forEach(function (methodName) {
      if (methodName && allowMethodsHeader.indexOf(methodName) >= 0) {
        allowedMethods[methodName.trim().toLowerCase()] = true;
      }
    });
  }

  if (acceptPatchHeader && acceptPatchHeader.indexOf('application/sparql-update') >= 0) {
    allowedMethods.patch = true;
  }

  return allowedMethods;
}

/**
* Parses a Link header from an XHR HTTP Request.
* @method parseLinkHeader
 *
* @param link {string} Contents of the Link response header
*
 * @return {Object}
*/
function parseLinkHeader(link) {
  if (!link) {
    return {};
  }

  var linkexp = /<[^>]*>\s*(\s*;\s*[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*")))*(,|$)/g;
  var paramexp = /[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*"))/g;
  var matches = link.match(linkexp);
  var rels = {};

  for (var i = 0; i < matches.length; i++) {
    var split = matches[i].split('>');
    var href = split[0].substring(1);
    var ps = split[1];
    var s = ps.match(paramexp);

    for (var j = 0; j < s.length; j++) {
      var p = s[j];
      var paramsplit = p.split('=');
      // var name = paramsplit[0]
      var rel = paramsplit[1].replace(/["']/g, '');

      if (!rels[rel]) {
        rels[rel] = [];
      }

      rels[rel].push(href);

      if (rels[rel].length > 1) {
        rels[rel].sort();
      }
    }
  }

  return rels;
}

/**
 * Converts a statement to string (if it isn't already) and returns the statement.
 * @method statementToNT
 *
 * @param statement {string|Triple} RDF Statement to be converted.
 * @param [excludeDot=false] {Boolean} Optionally slice off ending period.
 *
 * @return {string}
 */
function statementToNT(statement) {
  if (typeof statement !== 'string') {
    // This is an RDF Statement. Convert to string
    statement = statement.toCanonical();
  }

  return statement;
}
},{}],8:[function(require,module,exports){
'use strict';
/* global Components */
/**
 * Provides a generic wrapper around the XMLHttpRequest object, to make it
 * usable both in the browser and firefox extension and in Node.js
 * @module xhr
 */

var XMLHttpRequest;
if (typeof tabulator !== 'undefined' && tabulator.isExtension) {
  // Running inside the Tabulator Firefox extension
  // Cannot use XMLHttpRequest natively, must request it through SDK
  XMLHttpRequest = Components.classes['@mozilla.org/xmlextras/xmlhttprequest;1'].createInstance().QueryInterface(Components.interfaces.nsIXMLHttpRequest);
} else if (typeof window !== 'undefined' && 'XMLHttpRequest' in window) {
  // Running inside the browser
  XMLHttpRequest = window.XMLHttpRequest;
} else {
  // in Node.js
  XMLHttpRequest = require('xhr2');
}
module.exports = XMLHttpRequest;
},{"xhr2":14}],9:[function(require,module,exports){
'use strict'

module.exports = rdfNamespace

/**
 * Usage:
 *
 *   ```
 *   var rdf = require('rdflib')
 *   var ns = require('rdf-ns')(rdf)
 *
 *   var rdfs = ns.base('http://www.w3.org/2000/01/rdf-schema#')
 *   var seeAlso = rdfs('seeAlso')
 *   console.log(seeAlso)
 *   // -> NamedNode(<http://www.w3.org/2000/01/rdf-schema#seeAlso>)
 *   ```
 *
 * @class Namespace
 * @constructor
 * @param rdf {RDF} RDF library such as rdflib.js or rdf-ext (for dep injection)
 */
function Namespace (rdf) {
  this.rdf = rdf
}

/**
 * @param namespaceIri {String} Namespace IRI
 * @return {Function}
 */
Namespace.prototype.base = function base (namespaceIri) {
  var self = this
  /**
   * @param term {String} IRI fragment
   * @return {String|NamedNode}
   */
  return function fullIri (term) {
    if (self.rdf) {
      return self.rdf.namedNode(namespaceIri + term)
    } else {
      return namespaceIri + term
    }
  }
}

function rdfNamespace (rdf) {
  return new Namespace(rdf)
}

},{}],10:[function(require,module,exports){
'use strict'
/**
 * Provides a hashmap of relevant vocabs / namespaces.
 * Usage:
 *
 *   ```
 *   var rdf = require('rdflib')  // optional
 *   var vocab = require('solid-vocab')(rdf)  // or require('solid-vocab')()
 *   console.log(vocab.foaf('name'))  // -> <http://xmlns.com/foaf/0.1/name>
 *   ```
 * @module vocab
 */

/**
 * @param [rdf] {RDF} Optional RDF Library (such as rdflib.js or rdf-ext) to
 *   inject
 */
function vocab (rdf) {
  var ns = require('rdf-ns')(rdf)
  var vocabMap = {
    'acl': ns.base('http://www.w3.org/ns/auth/acl#'),
    'app': ns.base('http://www.w3.org/ns/solid/app#'),
    'dct': ns.base('http://purl.org/dc/terms/'),
    'foaf': ns.base('http://xmlns.com/foaf/0.1/'),
    'ldp': ns.base('http://www.w3.org/ns/ldp#'),
    'owl': ns.base('http://www.w3.org/2002/07/owl#'),
    'pim': ns.base('http://www.w3.org/ns/pim/space#'),
    'rdf': ns.base('http://www.w3.org/1999/02/22-rdf-syntax-ns#'),
    'rdfs': ns.base('http://www.w3.org/2000/01/rdf-schema#'),
    'schema': ns.base('http://schema.org/'),
    'sioc': ns.base('http://rdfs.org/sioc/ns#'),
    'solid': ns.base('http://www.w3.org/ns/solid/terms#'),
    'vcard': ns.base('http://www.w3.org/2006/vcard/ns#'),
    'xsd': ns.base('http://www.w3.org/2001/XMLSchema#')
  }
  return vocabMap
}

module.exports = vocab

},{"rdf-ns":9}],11:[function(require,module,exports){
var has = Object.hasOwnProperty
var proto = Object.getPrototypeOf
var trace = Error.captureStackTrace
module.exports = StandardError

function StandardError(msg, props) {
  // Let all properties be enumerable for easier serialization.
  if (msg && typeof msg == "object") props = msg, msg = undefined
  else this.message = msg

  // Name has to be an own property (or on the prototype a single step up) for
  // the stack to be printed with the correct name.
  if (props) for (var key in props) this[key] = props[key]
  if (!has.call(this, "name"))
    this.name = has.call(proto(this), "name")? this.name : this.constructor.name

  if (trace && !("stack" in this)) trace(this, this.constructor)
}

StandardError.prototype = Object.create(Error.prototype, {
  constructor: {value: StandardError, configurable: true, writable: true}
})

// Set name explicitly for when the code gets minified.
StandardError.prototype.name = "StandardError"

},{}],12:[function(require,module,exports){
module.exports={
	"100": "Continue",
	"101": "Switching Protocols",
	"102": "Processing",
	"200": "OK",
	"201": "Created",
	"202": "Accepted",
	"203": "Non-Authoritative Information",
	"204": "No Content",
	"205": "Reset Content",
	"206": "Partial Content",
	"207": "Multi-Status",
	"208": "Already Reported",
	"226": "IM Used",
	"300": "Multiple Choices",
	"301": "Moved Permanently",
	"302": "Found",
	"303": "See Other",
	"304": "Not Modified",
	"305": "Use Proxy",
	"307": "Temporary Redirect",
	"308": "Permanent Redirect",
	"400": "Bad Request",
	"401": "Unauthorized",
	"402": "Payment Required",
	"403": "Forbidden",
	"404": "Not Found",
	"405": "Method Not Allowed",
	"406": "Not Acceptable",
	"407": "Proxy Authentication Required",
	"408": "Request Timeout",
	"409": "Conflict",
	"410": "Gone",
	"411": "Length Required",
	"412": "Precondition Failed",
	"413": "Payload Too Large",
	"414": "URI Too Long",
	"415": "Unsupported Media Type",
	"416": "Range Not Satisfiable",
	"417": "Expectation Failed",
	"418": "I'm a teapot",
	"421": "Misdirected Request",
	"422": "Unprocessable Entity",
	"423": "Locked",
	"424": "Failed Dependency",
	"425": "Unordered Collection",
	"426": "Upgrade Required",
	"428": "Precondition Required",
	"429": "Too Many Requests",
	"431": "Request Header Fields Too Large",
	"500": "Internal Server Error",
	"501": "Not Implemented",
	"502": "Bad Gateway",
	"503": "Service Unavailable",
	"504": "Gateway Timeout",
	"505": "HTTP Version Not Supported",
	"506": "Variant Also Negotiates",
	"507": "Insufficient Storage",
	"508": "Loop Detected",
	"509": "Bandwidth Limit Exceeded",
	"510": "Not Extended",
	"511": "Network Authentication Required"
}

},{}],13:[function(require,module,exports){
exports = module.exports = HttpError
var StandardError = require("standard-error")
var STATUS_CODE_TO_NAME = require("./codes")
var STATUS_NAME_TO_CODE = exports

function HttpError(code, msg, props) {
  if (typeof code == "string") code = STATUS_NAME_TO_CODE[code]
  if (typeof code != "number") throw new TypeError("Non-numeric HTTP code")
  if (typeof msg == "object" && msg != null) { props = msg; msg = null }
  StandardError.call(this, msg || STATUS_CODE_TO_NAME[code], props)
  this.code = code
}

HttpError.prototype = Object.create(StandardError.prototype, {
  constructor: {value: HttpError, configurable: true, writable: true}
})

// Set name explicitly for when the code gets minified.
HttpError.prototype.name = "HttpError"

Object.defineProperties(HttpError.prototype, {
  statusCode: alias("code"),
  statusMessage: alias("message"),

  status: {
    configurable: true,
    get: function() { return this.code },
    set: function(value) {
      Object.defineProperty(this, "status", {
        value: value, configurable: true, enumerable: true, writable: true
      })
    }
  }
})

HttpError.prototype.toString = function() {
  return this.name + ": " + this.code + " " + this.message
}

for (var code in STATUS_CODE_TO_NAME) {
  var name = STATUS_CODE_TO_NAME[code]
  exports[name.replace("'", "").replace(/[- ]/g, "_").toUpperCase()] = +code
}

function alias(name) {
  return {
    configurable: true,
    get: function() { return this[name] },
    set: function(value) { return this[name] = value }
  }
}

},{"./codes":12,"standard-error":11}],14:[function(require,module,exports){
module.exports = XMLHttpRequest;

},{}]},{},[2])(2)
});