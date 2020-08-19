// Copyright (c) 2016, Frappe Technologies and contributors
// For license information, please see license.txt

frappe.ui.form.on('Auto Email Report', {
	refresh: function(frm) {
		if(frm.doc.report_type !== 'Report Builder') {
			if(frm.script_setup_for !== frm.doc.report && !frm.doc.__islocal) {
				frappe.call({
					method:"frappe.desk.query_report.get_script",
					args: {
						report_name: frm.doc.report
					},
					callback: function(r) {
						frappe.dom.eval(r.message.script || "");
						frm.script_setup_for = frm.doc.report;
						frm.trigger('show_filters');
					}
				});
			} else {
				frm.trigger('show_filters');
			}
		}
		if(!frm.is_new()) {
			frm.add_custom_button(__('Download'), function() {
				var w = window.open(
					frappe.urllib.get_full_url(
						"/api/method/frappe.email.doctype.auto_email_report.auto_email_report.download?"
						+"name="+encodeURIComponent(frm.doc.name)));
				if(!w) {
					frappe.msgprint(__("Please enable pop-ups")); return;
				}
			});
			frm.add_custom_button(__('Send Now'), function() {
				frappe.call({
					method: 'frappe.email.doctype.auto_email_report.auto_email_report.send_now',
					args: {names: [frm.doc.name]}
				});
			});
		} else {
			if(!frm.doc.user) {
				frm.set_value('user', frappe.session.user);
			}
		}
	},
	report: function(frm) {
		frm.set_value('filters', '');
	},
	show_filters: function(frm) {
		var wrapper = $(frm.get_field('filters_display').wrapper);
		wrapper.empty();
		if(frm.doc.report_type === 'Custom Report' || (frm.doc.report_type !== 'Report Builder'
			&& frappe.query_reports[frm.doc.report]
			&& frappe.query_reports[frm.doc.report].filters)) {

			// make a table to show filters
			var table = $('<table class="table table-bordered" style="cursor:pointer; margin:0px;"><thead>\
				<tr><th style="width: 50%">'+__('Filter')+'</th><th>'+__('Value')+'</th></tr>\
				</thead><tbody></tbody></table>').appendTo(wrapper);
			$('<p class="text-muted small">' + __("Click table to edit") + '</p>').appendTo(wrapper);

			var filters = JSON.parse(frm.doc.filters || '{}');

			let report_filters, report_name;

			if (frm.doc.report_type === 'Custom Report'
				&& frappe.query_reports[frm.doc.reference_report]
				&& frappe.query_reports[frm.doc.reference_report].filters) {
				report_filters = frappe.query_reports[frm.doc.reference_report].filters;
				report_name = frm.doc.reference_report;
			} else {
				report_filters = frappe.query_reports[frm.doc.report].filters;
				report_name = frm.doc.report;
			}

			var displayed_report_filters = report_filters;
			if(report_filters) {
				displayed_report_filters = report_filters.filter(d => !d.auto_email_report_ignore);
			}

			if(displayed_report_filters && displayed_report_filters.length > 0) {
				frm.set_value('filter_meta', JSON.stringify(displayed_report_filters));
				if (frm.is_dirty()) {
					frm.save();
				}
			}

			displayed_report_filters = displayed_report_filters.filter(d => d.fieldtype != 'Break');

			displayed_report_filters.forEach(function(f) {
				$('<tr><td>' + f.label + '</td><td>'+ frappe.format(filters[f.fieldname], f) +'</td></tr>')
					.appendTo(table.find('tbody'));
			});

			table.on('click', function() {
				var dialog = new frappe.ui.Dialog({
					fields: displayed_report_filters,
					primary_action: function() {
						var values = this.get_values();
						if(values) {
							this.hide();
							frm.set_value('filters', JSON.stringify(values));
							frm.trigger('show_filters');
						}
					}
				});
				dialog.show();

				//Set query report object so that it can be used while fetching filter values in the report
				frappe.query_report = new frappe.views.QueryReport({'filters': dialog.fields_list});
				frappe.query_reports[report_name].onload && frappe.query_reports[report_name].onload(frappe.query_report);
				dialog.set_values(filters);
			})

			// populate dynamic date field selection
			let date_fields = report_filters
				.filter(df => df.fieldtype === 'Date')
				.map(df => ({ label: df.label, value: df.fieldname }));
			frm.set_df_property('from_date_field', 'options', date_fields);
			frm.set_df_property('to_date_field', 'options', date_fields);
			frm.toggle_display('dynamic_report_filters_section', date_fields.length > 0);
		}
	}
});
