const controller = require('./controllers/patient.controller');

const scopes = [
  'user/*.*',
  'user/Patient.*',
  'user/Patient.read',
  'user/*.read',
  'patient/*.*',
  'patient/Patient.*',
  'patient/Patient.read',
  'patient/*.read'
];

const write_scopes = [
  'user/*.*',
  'user/Patient.*',
  'user/Patient.write',
  'user/*.read',
  'patient/*.*',
  'patient/Patient.*',
  'patient/Patient.write',
  'patient/*.read'
];

let routes = [
	{
		type: 'get',
		path: '/dstu2/patient',
		corsOptions: {
			methods: ['GET']
		},
		args: [{
			name: 'name',
			type: 'string'
		}, {
			name: 'birthdate',
			type: 'string'
		}, {
			name: 'gender',
			type: 'string'
		}, {
			name: 'given',
			type: 'string'
		}, {
			name: 'family',
			type: 'string'
		}],
		scopes: scopes,
		controller: controller.getPatient
	},
	{
		type: 'post',
		path: '/dstu2/patient/_search',
		corsOptions: {
			methods: ['POST']
		},
		args: [{
			name: 'name',
			type: 'string'
		}, {
			name: 'birthdate',
			type: 'string'
		}, {
			name: 'gender',
			type: 'string'
		}, {
			name: 'given',
			type: 'string'
		}, {
			name: 'family',
			type: 'string'
		}],
		scopes: scopes,
		controller: controller.getPatient
	},
	{
		type: 'get',
		path: '/dstu2/patient/:id',
		corsOptions: {
			methods: ['GET']
		},
		args: [{
			name: 'id',
			type: 'string',
			required: true
		}],
		scopes: scopes,
		controller: controller.getPatientById
	},
	{
		type: 'put',
		path: '/dstu2/patient/:id',
		corsOptions: {
			methods: ['PUT']
		},
		args: [{
			name: 'id',
			type: 'string',
			required: true
		}],
		scopes: write_scopes,
		controller: controller.updatePatient
	}
];

let codes = {
	gender: ['male', 'female', 'other', 'unknown']
};

/**
 * @name exports
 * @summary Patient config
 */
module.exports = {
	routes,
	codes
};
