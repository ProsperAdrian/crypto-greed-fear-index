const cc = DataStudioApp.createCommunityConnector();

function getAuthType() {
  return cc.newAuthTypeResponse()
    .setAuthType(cc.AuthType.NONE)
    .build();
}

function resetAuth() {
  var userProperties = PropertiesService.getUserProperties();
  userProperties.deleteProperty('dscc.key');
}

function isAuthValid() {
  return true; // No authentication needed
}

function setCredentials(request) {
  return cc.newSetCredentialsResponse()
    .setIsValid(true)
    .build();
}

function getConfig() {
  const config = cc.getConfig();

  config.setDateRangeRequired(true);

  return config.build();
}

function getFields() {
  const fields = cc.getFields();

  fields.newDimension()
    .setId('value')
    .setName('Value')
    .setDescription('Index Value')
    .setType(cc.FieldType.NUMBER);

  fields.newDimension()
    .setId('value_classification')
    .setName('Classification')
    .setDescription('Name of the Index')
    .setType(cc.FieldType.TEXT);

  fields.newDimension()
    .setId('timestamp')
    .setName('Date')
    .setDescription('Date in YYYYMMDD format')
    .setType(cc.FieldType.YEAR_MONTH_DAY);

  fields.newMetric()
    .setId('time_until_update')
    .setName('Countdown')
    .setDescription('Countdown')
    .setType(cc.FieldType.NUMBER);

  return fields;
}

function getSchema() {
  return cc.newGetSchemaResponse()
    .setFields(getFields())
    .build();
}

function getData(request) {
  let res = UrlFetchApp.fetch('https://api.alternative.me/fng/?limit=100000000000000');
  res = JSON.parse(res.getContentText()).data; // Accessing the 'data' field from response

  let requestedIds = request.fields.map(object => object['name']);
  let data = [];

  for (let value of res) {
    let row = [];
    for (let requestedId of requestedIds) {
      switch (requestedId) {
        case 'value':
          row.push(value['value']);
          break;
        case 'value_classification':
          row.push(value['value_classification']);
          break;
        case 'timestamp':
          // Convert Unix timestamp to YYYYMMDD format
          let date = new Date(value['timestamp'] * 1000);
          let year = date.getFullYear().toString();
          let month = (date.getMonth() + 1).toString().padStart(2, '0');
          let day = date.getDate().toString().padStart(2, '0');
          row.push(`${year}${month}${day}`);
          break;
        case 'time_until_update':
          row.push(value['time_until_update']);
          break;
        default:
          row.push('');
          break;
      }
    }
    data.push(row);
  }

  let fields = getFields().forIds(requestedIds);

  return cc.newGetDataResponse()
    .setFields(fields)
    .addAllRows(data)
    .build();
}
