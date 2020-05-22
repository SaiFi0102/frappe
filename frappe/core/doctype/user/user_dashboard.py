from frappe import _

def get_data():
	return {
		'fieldname': 'user',
		'transactions': [
			{
				'label': _('References'),
				'items': ['Contact']
			}
		]
	}