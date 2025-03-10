/* checksum : 27a1b302424e67398d176192f6a05f14 */
@cds.external : true
@m.IsDefaultEntityContainer : 'true'
service EmpPayCompNonRecurring {};

@cds.external : true
@cds.persistence.skip : true
@sap.label : 'Non Recurring Pay Components'
@sap.creatable : 'false'
@sap.updatable : 'false'
@sap.upsertable : 'true'
@sap.deletable : 'false'
entity EmpPayCompNonRecurring.EmpPayCompNonRecurring {
  @sap.required : 'false'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.upsertable : 'true'
  @sap.visible : 'true'
  @sap.sortable : 'true'
  @sap.filterable : 'true'
  @sap.label : 'Sequence Number'
  key sequenceNumber : LargeString not null;
  @sap.required : 'true'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.upsertable : 'true'
  @sap.visible : 'true'
  @sap.sortable : 'true'
  @sap.filterable : 'true'
  @sap.label : 'User ID'
  key userId : String(100) not null;
  @sap.required : 'false'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.upsertable : 'false'
  @sap.visible : 'true'
  @sap.sortable : 'true'
  @sap.filterable : 'true'
  @sap.label : 'Created By'
  createdBy : String(100);
  @odata.Type : 'Edm.DateTimeOffset'
  @sap.required : 'false'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.upsertable : 'false'
  @sap.visible : 'true'
  @sap.sortable : 'true'
  @sap.filterable : 'true'
  @sap.label : 'Created Date Time'
  createdDateTime : DateTime;
  @sap.required : 'false'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.upsertable : 'false'
  @sap.visible : 'true'
  @sap.sortable : 'true'
  @sap.filterable : 'true'
  @sap.display.format : 'Date'
  @sap.label : 'Created On'
  createdOn : Date;
  @sap.required : 'true'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.upsertable : 'true'
  @sap.visible : 'true'
  @sap.sortable : 'true'
  @sap.filterable : 'true'
  @sap.label : 'Currency'
  currencyCode : String(20);
  @sap.required : 'false'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.upsertable : 'true'
  @sap.visible : 'true'
  @sap.sortable : 'false'
  @sap.filterable : 'false'
  @sap.label : 'Reference Number'
  customString1 : String(256);
  @sap.required : 'false'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.upsertable : 'false'
  @sap.visible : 'true'
  @sap.sortable : 'true'
  @sap.filterable : 'true'
  @sap.label : 'Last Modified By'
  lastModifiedBy : String(100);
  @odata.Type : 'Edm.DateTimeOffset'
  @sap.required : 'false'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.upsertable : 'false'
  @sap.visible : 'true'
  @sap.sortable : 'true'
  @sap.filterable : 'true'
  @sap.label : 'Last Modified Date Time'
  lastModifiedDateTime : DateTime;
  @sap.required : 'false'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.upsertable : 'false'
  @sap.visible : 'true'
  @sap.sortable : 'true'
  @sap.filterable : 'true'
  @sap.display.format : 'Date'
  @sap.label : 'Last Modified On'
  lastModifiedOn : Date;
  @sap.required : 'false'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.upsertable : 'true'
  @sap.visible : 'true'
  @sap.sortable : 'false'
  @sap.filterable : 'false'
  @sap.label : 'notes'
  notes : String(4000);
  @sap.required : 'false'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.upsertable : 'true'
  @sap.visible : 'true'
  @sap.sortable : 'false'
  @sap.filterable : 'false'
  @sap.label : 'Number'
  numberOfUnits : Double;
  @sap.required : 'false'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.upsertable : 'true'
  @sap.visible : 'false'
  @sap.sortable : 'false'
  @sap.filterable : 'false'
  @sap.label : 'operation'
  operation : LargeString;
  @sap.required : 'true'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.upsertable : 'true'
  @sap.visible : 'true'
  @sap.sortable : 'true'
  @sap.filterable : 'true'
  @sap.label : 'Pay Component'
  payComponentCode : LargeString not null;
  @sap.required : 'true'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.upsertable : 'true'
  @sap.visible : 'true'
  @sap.sortable : 'true'
  @sap.filterable : 'true'
  @sap.display.format : 'Date'
  @sap.label : 'Issue Date'
  payDate : Date not null;
  @sap.required : 'false'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.upsertable : 'true'
  @sap.visible : 'true'
  @sap.sortable : 'false'
  @sap.filterable : 'false'
  @sap.label : 'Unit of Measure'
  unitOfMeasure : String(128);
  @sap.required : 'true'
  @sap.creatable : 'false'
  @sap.updatable : 'false'
  @sap.upsertable : 'true'
  @sap.visible : 'true'
  @sap.sortable : 'true'
  @sap.filterable : 'true'
  @sap.label : 'Amount'
  value : Double;
};

