const errors = require('../../../utils/error.utils');
const { VERSIONS } = require('../../../../constants');
const { Patient } = require('../../resources');


module.exports.getPatient = (profile, logger, config) => {
	let { serviceModule: service } = profile;

	// Create a context I can pass some data through
	let context = {
		version: VERSIONS.DSTU2
	};

	return (req, res, next) => {
		// @TODO Validate arguments and response
		/**
		* return service.getPatient(req, logger)
		*		.then(sanitizeResponse) // Only show the user what they are allowed to see
		*		.then(validateResponse); // Make sure the response data conforms to the spec
		*/
		return service.getPatient(req, logger, context)
			.then((patients) => {
				const searchResults = {
					'total': 0,
					'resourceType': 'Bundle',
					'type': 'searchset',
					'entry': []
				};

				if (patients) {
					for (let resource of patients) {
						if (!req.patient || req.patient === resource.patientId) {
							// Modes:
							// match - This resource matched the search specification.
							// include - This resource is returned because it is referred to from another resource in the search set.
							// outcome - An OperationOutcome that provides additional information about the processing of a search.
							const entry = {
								'search': {
									'mode': 'match'
								},
								'resource': new Patient(resource),
								'fullUrl': `${config.auth.resourceServer}/dstu2/Patient/${resource.id}`
							};
							searchResults.entry.push(entry);
						}
						searchResults.total = searchResults.entry.length;
					}
				}

				res.status(200).json(searchResults);
			})
			.catch((err) => {
				next(errors.internal(err.message));
			});
	};
};


module.exports.getPatientById = (profile, logger) => {
	let { serviceModule: service } = profile;

	// Create a context I can pass some data through
	let context = {
		version: VERSIONS.DSTU2
	};

	return (req, res, next) => {

		// If we have req.patient, then we need to validate that this patient
		// is only accessing resources with his id, he is not allowed to access others
		if (
			req.patient
			&& req.body
			&& req.body.id
			&& req.patient !== req.body.id
		) {
			return next(errors.unauthorized(`You are not allowed to access patient ${req.body.id}.`));
		}

		return service.getPatientById(req, logger, context)
			.then((patient) => {
				if (patient) {
					res.status(200).json(new Patient(patient));
				} else {
					next(errors.notFound('Patient not found'));
				}
			})
			.catch((err) => {
				next(errors.internal(err.message));
			});
	};
};


module.exports.updatePatient = (profile, logger, config) => {
	let { serviceModule: service } = profile;

	// Create a context I can pass some data through
	let context = {
		version: VERSIONS.DSTU2
	};

	return (req, res, next) => {
		// @TODO Validate arguments and response
		/**
		* return service.getPatient(req, logger)
		*		.then(sanitizeResponse) // Only show the user what they are allowed to see
		*		.then(validateResponse); // Make sure the response data conforms to the spec
		*/
		return service.updatePatient(req, logger, context)
			.then((results) => {
				res.status(200).send();
			})
			.catch((err) => {
				next(errors.internal(err.message));
			});
	};
};
