import frappe

def execute():
	frappe.db.sql("delete from `tabCustom DocPerm`")

	names = frappe.db.sql_list("""
		select cr.name
		from `tabCustom Role` cr
		inner join `tabReport` r on r.name = cr.report
		where r.is_standard = 'Yes'
	""")

	for name in names:
		frappe.delete_doc("Custom Role", name)
