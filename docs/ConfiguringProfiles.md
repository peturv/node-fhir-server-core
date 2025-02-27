## Overview

We are currently focused on being fully compliant with the the latest major stable releases. In this section, we will discuss the options you have for enabling capabilities for each resource and version.

## Profile Configuration

### Supported Profiles

Go to [src/constants.js](https://github.com/Asymmetrik/node-fhir-server-core/blob/master/src/constants.js#L1) to find a list of all supported profiles with their associated keys.

Profiles have the following configuration options:

#### `service`

- **Type:** `string|object`
- **Description:** Path to a service module or the actual module itself (e.g. `require('path/to/service')`).
- **Required:** `Yes`
- **Default:** `none`

#### `versions`

- **Type:** `Array<string>`
- **Description:** An array of strings containing the versions you intend to support. You cannot add anything you want here, only valid versions supported in core will be used. See [`exports.VERSIONS`](https://github.com/Asymmetrik/node-fhir-server-core/blob/master/src/constants.js) in the constants file.
- **Required:** `Yes`
- **Default:** `none`

#### `corsOptions`

- **Type:** `object`
- **Description:** Set profile specific cors options. These will override the default `corsOptions` set in the server config.  Please see [https://github.com/expressjs/cors#configuration-options](https://github.com/expressjs/cors#configuration-options) for details. The `methods` configuration will not be honored if specified here. This is controlled by `@asymmetrik/node-fhir-server-core` and cannot be overridden.
- **Required:** `No`
- **Default:** `none`

## Profile(s) Interface

Each profile has a predefined set of methods it can implement. If you do not want to support a particular interaction, for example, delete, then just don't implement the remove method. Each method you implement must be async or return a promise and will receive the following three arguments (see sample code below):

- `args` - An object containing all the sanitized arguments passed into the request. The arguments these contain will change based on the endpoint, e.g. create and delete have different args and search has different args between a patient and an observation. See below for more information.
- `context` - Additional contextual information about the request. Currently it contains an object with the original request object in it. We can always add more to this if you have a need for something to be passed in.

**NOTE** - We used to pass the logger in as an argument. We have made several changes to loggers in general to make them more flexible and less annoying to pass around. You now need to load them yourselves from the core library. You also need to load the schemas and return the objects explicitly as we no longer do the casting ourselves. A service will commonly at least have the following setup:

```javascript
const { loggers, resolveSchema } = require('@asymmetrik/node-fhir-server-core');
const logger = loggers.get('default');
```

**NOTE** - All examples are pseudocode to demonstrate some basic usage and are untested.

### Available Methods

#### `search`
- **Description:** Get the resource given one of several valid argument(s) and/or  combination(s) of arguments in the req.query.
- **Return:** `Promise.<object, Error>`
- **Routes:** Enables `/:base_version/[profile_name]` via GET and `/:base_version/[profile_name]/_search` via POST
- **Example:**
```javascript
const { resolveSchema } = require('@asymmetrik/node-fhir-server-core');
// In patient service
module.exports.search = async (args, context) => {
	let BundleEntry = require(resolveSchema(args.base_version, 'bundleentry'));
	let Bundle = require(resolveSchema(args.base_version, 'bundle'));
	let Patient = require(resolveSchema(args.base_version, 'patient'));
	// You will need to build your query based on the sanitized args
	let query = myCustomQueryBuilder(args);
	let results = await db.patients.find(query).toArray();
	let patients = results.map(result => new Patient(result));
	let entries = patients.map(patient => new BundleEntry({ resource: patient }));
	return new Bundle({ entry: entries });
};
```

#### `searchById`
- **Description:** Get the patient given an id in the req.params.
- **Return:** `Promise.<object, Error>`
- **Routes:** Enables `:base_version/[profile_name]/:id` via GET
- **Example:**
```javascript
const { resolveSchema } = require('@asymmetrik/node-fhir-server-core');
// In patient service
module.exports.searchById = async (args, context) => {
	let Patient = require(resolveSchema(args.base_version, 'patient'));
	let result = await db.patients.find({ _id: args.id });
	return new Patient(result);
};
```

#### `searchByVersionId`
- **Description:** Get the patient given an id and version id in the req.params.
- **Return:** `Promise.<object, Error>`
- **Routes:** Enables `:base_version/[profile_name]/:id/_history/:version_id` via GET
- **Example:**
```javascript
const { resolveSchema } = require('@asymmetrik/node-fhir-server-core');
// In patient service
module.exports.searchByVersionId = async (args, context) => {
	let Patient = require(resolveSchema(args.base_version, 'patient'));
	let result = await db.patients.find({ _id: args.id, versionId: args.version_id });
	return new Patient(result);
};
```

#### `history`
- **Description:** Get the resource history given one of several valid argument(s) and/or  combination(s) of arguments in the req.query.
- **Return:** `Promise.<object, Error>`
- **Routes:** Enables `/:base_version/[profile_name]/_history` via GET
- **Example:**
```javascript
const { resolveSchema } = require('@asymmetrik/node-fhir-server-core');
// In patient service
module.exports.history = async (args, context) => {
	let BundleEntry = require(resolveSchema(args.base_version, 'bundleentry'));
	let Bundle = require(resolveSchema(args.base_version, 'bundle'));
	let Patient = require(resolveSchema(args.base_version, 'patient'));
	// You will need to build your query based on the sanitized args
	let query = myCustomQueryBuilder(args);
	let results = await db.patientHistory.find(query);
	let patients = results.map(result => new Patient(result));
	let entries = patients.map(patient => new BundleEntry({ resource: patient }));
	let bundle = new Bundle({ entry: entries });
	return bundle;
};
```

#### `historyById`
- **Description:** Get the patient given an id in the req.params.
- **Return:** `Promise.<object, Error>`
- **Routes:** Enables `/:base_version/[profile_name]/:id/_history` via GET
- **Example:**
```javascript
const { resolveSchema } = require('@asymmetrik/node-fhir-server-core');
// In patient service
module.exports.historyById = async (args, context) => {
	let Patient = require(resolveSchema(args.base_version, 'patient'));
	let result = await db.patientHistory.find({ _id: args.id });
	return new Patient(result);
};
```

#### `create`
- **Description:** Create a FHIR resource.
- **Return:** `Promise.<{ id: string, resource_version: string }, Error>`
- **Routes:** Enables `/:base_version/[profile_name]` via POST 
- **Example:**
```javascript
const { resolveSchema } = require('@asymmetrik/node-fhir-server-core');
// In patient service
module.exports.create = async (args, context) => {
	let Patient = require(resolveSchema(args.base_version, 'patient'));
	let doc = new Patient(args.resource).toJSON();
	let results = await db.patients.insertOne(doc);

	return {
		id: results._id,
		// This is optional if you support versions
		resource_version: 1,
	};
};
```

#### `update`
- **Description:** Create or update a FHIR resource.
- **Return:** `Promise.<{ id: string, resource_version: string }, Error>`
- **Routes:** Enables `/:base_version/[profile_name]/:id` via PUT
- **Example:**
```javascript
const { resolveSchema } = require('@asymmetrik/node-fhir-server-core');
// In patient service
module.exports.update = async (args, context) => {
	let Patient = require(resolveSchema(args.base_version, 'patient'));
	let doc = new Patient(args.resource).toJSON();
	let results = await db.patients.findOneAndUpdate({
		{ _id: args.id },
		{ $set: doc },
		{ upsert: true },
	});

	return {
		id: results._id,
		// This is optional if you support versions
		resource_version: 1,
	};
};
```

#### `patch`
- **Description:** Patch the resource given an id in the req.params.
- **Return:** `Promise.<object, Error>`
- **Routes:** Enables `/:base_version/[profile_name]/:id` via PATCH
- **Example:**
```javascript
const { resolveSchema } = require('@asymmetrik/node-fhir-server-core');
// In patient service
module.exports.patch = async (args, context) => {
	let Patient = require(resolveSchema(args.base_version, 'patient'));
	let doc = new Patient(args.resource).toJSON();
	let current = await db.patients.findOne({ _id: args.id });
	let patch = insertPatchLibraryHereAndPatchDocuments(doc, current);
	
	let results = await db.patients.findOneAndUpdate({
		{ _id: args.id },
		{ $set: patch },
		{ upsert: true },
	});

	return {
		id: results._id,
		// This is optional if you support versions
		resource_version: 1,
	};
};
```

#### `remove`
- **Description:** Delete a FHIR resource.
- **Return:** `Promise.<object, { code: string, message: string}>`
- **Routes:** Enables `/:base_version/[profile_name]/:id` via DELETE
- **Example:**
```javascript
const { ServerError } = require('@asymmetrik/node-fhir-server-core');
// In patient service
module.exports.remove = async (args, context) => {
	try {
		await db.patients.remove({ _id: args.id });
	} catch (err) {
		// Must be 405 (Method Not Allowed) or 409 (Conflict)
		// 405 if you do not want to allow the delete
		// 409 if you can't delete because of referential
		// integrity or some other reason
		throw new ServerError(err.message, {
			statusCode: 409,
			issue: [{
				severity: 'error',
				code: 'internal',
				details: {
					text: err.message
				}
			}]
		});
	}

	return;
};
```

## Arguments
Each resource supports the arguments defined by the specification for it's version. You can either review the official FHIR documentation or you can look in the [resources](../src/server/resources) directory of this project. Each folder in there represents a version we support, and in each folder is a parameters folder which defines the parameters for each resource. When an API endpoint is hit, each resource will allow it's own arguments and any from parent resources, such as resource and/or domain resource.
