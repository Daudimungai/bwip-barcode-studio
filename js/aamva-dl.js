/**
 * AAMVA Driver License (DL) / Identification Card PDF417 Engine
 * Implements AAMVA DL/ID Card Design Standard (v08 / v09 / v10)
 * Formats structured driver license fields into valid PDF417 binary payloads and parses raw DL barcodes.
 */

const AAMVA_JURISDICTIONS = [
  { code: 'CA', name: 'California', iin: '636000' },
  { code: 'NY', name: 'New York', iin: '636001' },
  { code: 'TX', name: 'Texas', iin: '636002' },
  { code: 'FL', name: 'Florida', iin: '636003' },
  { code: 'IL', name: 'Illinois', iin: '636004' },
  { code: 'PA', name: 'Pennsylvania', iin: '636005' },
  { code: 'OH', name: 'Ohio', iin: '636006' },
  { code: 'GA', name: 'Georgia', iin: '636007' },
  { code: 'ON', name: 'Ontario (Canada)', iin: '636008' },
  { code: 'NC', name: 'North Carolina', iin: '636009' },
  { code: 'MI', name: 'Michigan', iin: '636010' },
  { code: 'NJ', name: 'New Jersey', iin: '636011' },
  { code: 'VA', name: 'Virginia', iin: '636012' },
  { code: 'WA', name: 'Washington', iin: '636013' },
  { code: 'AZ', name: 'Arizona', iin: '636014' },
  { code: 'MA', name: 'Massachusetts', iin: '636015' },
  { code: 'TN', name: 'Tennessee', iin: '636016' },
  { code: 'IN', name: 'Indiana', iin: '636017' },
  { code: 'MO', name: 'Missouri', iin: '636018' },
  { code: 'MD', name: 'Maryland', iin: '636019' },
  { code: 'WI', name: 'Wisconsin', iin: '636020' },
  { code: 'CO', name: 'Colorado', iin: '636021' },
  { code: 'MN', name: 'Minnesota', iin: '636022' },
  { code: 'SC', name: 'South Carolina', iin: '636023' },
  { code: 'AL', name: 'Alabama', iin: '636024' },
  { code: 'LA', name: 'Louisiana', iin: '636025' },
  { code: 'KY', name: 'Kentucky', iin: '636026' },
  { code: 'OR', name: 'Oregon', iin: '636027' },
  { code: 'OK', name: 'Oklahoma', iin: '636028' },
  { code: 'CT', name: 'Connecticut', iin: '636029' },
  { code: 'UT', name: 'Utah', iin: '636030' },
  { code: 'IA', name: 'Iowa', iin: '636031' },
  { code: 'NV', name: 'Nevada', iin: '636032' },
  { code: 'AR', name: 'Arkansas', iin: '636033' },
  { code: 'MS', name: 'Mississippi', iin: '636034' },
  { code: 'KS', name: 'Kansas', iin: '636035' },
  { code: 'NM', name: 'New Mexico', iin: '636036' },
  { code: 'NE', name: 'Nebraska', iin: '636037' },
  { code: 'ID', name: 'Idaho', iin: '636038' },
  { code: 'WV', name: 'West Virginia', iin: '636039' },
  { code: 'HI', name: 'Hawaii', iin: '636040' },
  { code: 'NH', name: 'New Hampshire', iin: '636041' },
  { code: 'ME', name: 'Maine', iin: '636042' },
  { code: 'RI', name: 'Rhode Island', iin: '636043' },
  { code: 'MT', name: 'Montana', iin: '636044' },
  { code: 'DE', name: 'Delaware', iin: '636045' },
  { code: 'SD', name: 'South Dakota', iin: '636046' },
  { code: 'ND', name: 'North Dakota', iin: '636047' },
  { code: 'AK', name: 'Alaska', iin: '636048' },
  { code: 'VT', name: 'Vermont', iin: '636049' },
  { code: 'WY', name: 'Wyoming', iin: '636050' },
  { code: 'DC', name: 'District of Columbia', iin: '636051' }
];

const EYE_COLORS = [
  { code: 'BLK', name: 'BLK (Black)' },
  { code: 'BLU', name: 'BLU (Blue)' },
  { code: 'BRO', name: 'BRO (Brown)' },
  { code: 'GRN', name: 'GRN (Green)' },
  { code: 'HAZ', name: 'HAZ (Hazel)' },
  { code: 'GRY', name: 'GRY (Gray)' },
  { code: 'MAR', name: 'MAR (Maroon)' },
  { code: 'PNK', name: 'PNK (Pink)' },
  { code: 'DIC', name: 'DIC (Dichromatic)' },
  { code: 'UNK', name: 'UNK (Unknown)' }
];

const HAIR_COLORS = [
  { code: 'BLK', name: 'BLK (Black)' },
  { code: 'BAL', name: 'BAL (Bald)' },
  { code: 'BLN', name: 'BLN (Blond)' },
  { code: 'BRO', name: 'BRO (Brown)' },
  { code: 'GRY', name: 'GRY (Gray)' },
  { code: 'RED', name: 'RED (Red / Auburn)' },
  { code: 'SDY', name: 'SDY (Sandy)' },
  { code: 'WHI', name: 'WHI (White)' },
  { code: 'UNK', name: 'UNK (Unknown)' }
];

const RACE_CODES = [
  { code: 'Black', name: 'Black' },
  { code: 'White', name: 'White' },
  { code: 'Asian', name: 'Asian / Pacific Islander' },
  { code: 'Hispanic', name: 'Hispanic' },
  { code: 'AI/AN', name: 'American Indian / Alaska Native' },
  { code: 'Unknown', name: 'Unknown / Other' }
];

const SUFFIX_CODES = [
  { code: 'NONE', name: 'NONE' },
  { code: 'JR', name: 'JR' },
  { code: 'SR', name: 'SR' },
  { code: '1ST', name: '1ST / I' },
  { code: '2ND', name: '2ND / II' },
  { code: '3RD', name: '3RD / III' },
  { code: '4TH', name: '4TH / IV' }
];

/**
 * Returns sample Driver License form data object matching reference specimen
 */
function getSampleDLFormData() {
  return {
    state: 'CA',
    iin: '636000',
    aamvaVer: '08',
    subfileType: 'DL',
    
    // Personal Details
    licenseNum: 'D1234567',
    firstName: 'John',
    lastName: 'Doe',
    middleName: '',
    suffix: 'NONE',
    sex: '1', // 1=Male, 2=Female, 9=Unspecified
    donor: 'No',
    dob: '01151970', // MMDDYYYY
    heightInches: '69', // 69 in (≈ 175 cm)
    weightLbs: '169', // 169 lb (≈ 76 kg)
    limitedTerm: 'No',
    eyeAsOnDl: 'BRN',
    eyeColor: 'BRO',
    hairAsOnDl: 'BRN',
    hairColor: 'BRO',
    race: 'White',

    // Address
    street: '516 Anson Ct',
    city: 'Ronhert Park',
    jurisdiction: 'CA',
    zip: '875420000',
    country: 'USA',

    // License Metadata
    issueDate: '11262025', // MMDDYYYY
    expDate: '01152030', // MMDDYYYY
    vehicleClass: 'C',
    restrictions: 'NONE',
    endorsements: 'NONE',
    discriminator: '08/25/202165508/AAFD/26',
    realId: 'F', // F=Compliant, N=Non-compliant
    inventoryControl: '21237D12345670401'
  };
}

/**
 * Builds AAMVA compliant raw payload string
 */
function buildAAMVAString(f) {
  // Format subfile fields array
  const fields = [];

  // Required AAMVA DL Mandatory Fields
  if (f.vehicleClass) fields.push(`DCA${f.vehicleClass.toUpperCase()}`);
  if (f.restrictions) fields.push(`DCB${f.restrictions.toUpperCase()}`);
  if (f.expDate) fields.push(`DBA${f.expDate}`);
  if (f.lastName) fields.push(`DCS${f.lastName.toUpperCase()}`);
  if (f.firstName) fields.push(`DAC${f.firstName.toUpperCase()}`);
  if (f.middleName) fields.push(`DAD${f.middleName.toUpperCase()}`);
  if (f.suffix && f.suffix !== 'NONE') fields.push(`DCU${f.suffix.toUpperCase()}`);
  if (f.issueDate) fields.push(`DBD${f.issueDate}`);
  if (f.dob) fields.push(`DBB${f.dob}`);
  if (f.sex) fields.push(`DBC${f.sex}`);
  if (f.eyeColor) fields.push(`DAY${f.eyeColor}`);
  if (f.heightInches) fields.push(`DAU${String(f.heightInches).padStart(3, '0')} in`);
  if (f.street) fields.push(`DAG${f.street.toUpperCase()}`);
  if (f.city) fields.push(`DAI${f.city.toUpperCase()}`);
  if (f.jurisdiction) fields.push(`DAJ${f.jurisdiction.toUpperCase()}`);
  if (f.zip) fields.push(`DAK${f.zip}`);
  if (f.licenseNum) fields.push(`DAQ${f.licenseNum.toUpperCase()}`);
  if (f.discriminator) fields.push(`DCF${f.discriminator.toUpperCase()}`);
  if (f.country) fields.push(`DCG${f.country.toUpperCase()}`);

  // Optional / Additional Fields
  if (f.hairColor) fields.push(`DAZ${f.hairColor}`);
  if (f.weightLbs) fields.push(`DAW${String(f.weightLbs).padStart(3, '0')}`);
  if (f.race) fields.push(`DCL${f.race}`);
  if (f.limitedTerm) fields.push(`DDB${f.limitedTerm === 'Yes' ? '1' : '0'}`);
  if (f.endorsements) fields.push(`DCD${f.endorsements.toUpperCase()}`);
  if (f.inventoryControl) fields.push(`DCK${f.inventoryControl}`);
  if (f.realId) fields.push(`DDA${f.realId}`);
  if (f.donor) fields.push(`DDK${f.donor === 'Yes' ? '1' : '2'}`);

  // Construct subfile payload text
  const subfileType = f.subfileType || 'DL';
  const subfileBody = subfileType + fields.join('\n') + '\n\r';
  const subfileLength = subfileBody.length;

  // Header Calculations
  // Format: @\n\x1e\rANSI 636000080001DL00300240
  // Header fixed prefix length = 19 + 10 = 29 bytes before offset table
  const subfileOffset = 30; // 30 bytes header
  
  const padOffset = String(subfileOffset).padStart(4, '0');
  const padLen = String(subfileLength).padStart(4, '0');
  const iin = (f.iin || '636000').padStart(6, '0');
  const ver = (f.aamvaVer || '08').padStart(2, '0');
  const jurVer = '00';
  const numEntries = '01';

  const header = `@\n\x1e\rANSI ${iin}${ver}${jurVer}${numEntries}${subfileType}${padOffset}${padLen}`;

  return header + subfileBody;
}

/**
 * Parses raw AAMVA DL string back into human readable key-value object
 */
function parseAAMVAString(raw) {
  const result = {
    isValidAAMVA: false,
    header: {},
    fields: {},
    rawPayload: raw
  };

  if (!raw || typeof raw !== 'string') return result;

  // Check header sentinel @
  if (raw.indexOf('@') === -1 || raw.indexOf('ANSI') === -1) {
    return result;
  }

  result.isValidAAMVA = true;
  const ansiIdx = raw.indexOf('ANSI');
  const headerChunk = raw.substring(ansiIdx, ansiIdx + 30);
  
  result.header = {
    iin: headerChunk.substring(5, 11),
    aamvaVer: headerChunk.substring(11, 13),
    jurVer: headerChunk.substring(13, 15),
    numEntries: headerChunk.substring(15, 17),
    subfileType: headerChunk.substring(17, 19),
    offset: headerChunk.substring(19, 23),
    length: headerChunk.substring(23, 27)
  };

  // Find fields by 3-character tags (e.g. DAQ, DCS, DAC, DBB, etc.)
  const fieldTagNames = {
    DAQ: 'Driver License Number',
    DCS: 'Last Name / Family Name',
    DAC: 'First Name',
    DAD: 'Middle Name',
    DCU: 'Name Suffix',
    DBB: 'Date of Birth (MMDDYYYY)',
    DBA: 'Expiration Date',
    DBD: 'Issue Date',
    DBC: 'Sex / Gender (1=M, 2=F)',
    DAY: 'Eye Color',
    DAZ: 'Hair Color',
    DCL: 'Race (ANSI D-20)',
    DAU: 'Height',
    DAW: 'Weight (lbs)',
    DAG: 'Street Address',
    DAI: 'City',
    DAJ: 'State / Jurisdiction',
    DAK: 'Postal ZIP Code',
    DCG: 'Country',
    DCA: 'Vehicle Class',
    DCB: 'Restrictions',
    DCD: 'Endorsements',
    DCF: 'Document Discriminator',
    DCK: 'Inventory Control',
    DDA: 'Real ID Compliance'
  };

  const lines = raw.split(/\r?\n/);
  lines.forEach(line => {
    line = line.trim();
    if (line.length >= 4) {
      const code = line.substring(0, 3);
      if (fieldTagNames[code]) {
        result.fields[code] = {
          code: code,
          label: fieldTagNames[code],
          value: line.substring(3)
        };
      }
    }
  });

  return result;
}

/**
 * Field Randomizer Helpers (pdf417.pro calculator buttons)
 */
function getRandomDLNum() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const l = letters[Math.floor(Math.random() * letters.length)];
  const n = Math.floor(1000000 + Math.random() * 9000000);
  return `${l}${n}`;
}

function getRandomFirstName() {
  const names = ['Joe', 'John', 'Michael', 'James', 'David', 'Robert', 'William', 'Richard', 'Thomas', 'Charles', 'Daniel', 'Matthew', 'Anthony', 'Donald', 'Mark', 'Paul', 'Steven', 'Andrew', 'Kenneth', 'Joshua', 'Kevin', 'Brian', 'George', 'Edward', 'Ronald', 'Timothy', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin'];
  return names[Math.floor(Math.random() * names.length)];
}

function getRandomLastName() {
  const names = ['Meza', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill'];
  return names[Math.floor(Math.random() * names.length)];
}

function getRandomMiddleName() {
  const names = ['William', 'Alexander', 'James', 'Edward', 'Joseph', 'Lee', 'Thomas', 'Charles', 'Michael', 'David', 'Alan', 'Ray', 'Wayne', 'Eugene', 'Scott', 'Francis', 'Paul', 'Anthony', 'Henry', 'Arthur'];
  return names[Math.floor(Math.random() * names.length)];
}

function getRandomDOB() {
  const m = String(Math.floor(1 + Math.random() * 12)).padStart(2, '0');
  const d = String(Math.floor(1 + Math.random() * 28)).padStart(2, '0');
  const y = Math.floor(1965 + Math.random() * 38);
  return `${m}${d}${y}`;
}

function getRandomIssueDate() {
  const m = String(Math.floor(1 + Math.random() * 12)).padStart(2, '0');
  const d = String(Math.floor(1 + Math.random() * 28)).padStart(2, '0');
  const y = Math.floor(2020 + Math.random() * 4);
  return `${m}${d}${y}`;
}

function getRandomExpDate(dobStr) {
  let m = '01';
  let d = '01';
  if (dobStr && dobStr.length === 8) {
    m = dobStr.substring(0, 2);
    d = dobStr.substring(2, 4);
  }
  const y = Math.floor(2026 + Math.random() * 5);
  return `${m}${d}${y}`;
}

function getRandomDD() {
  const dateStr = '12/01/2020';
  const num = Math.floor(10000 + Math.random() * 90000);
  const code = 'AAFD/' + Math.floor(10 + Math.random() * 90);
  return `${dateStr}${num}/${code}`;
}

function getRandomICN(dlNumStr) {
  const prefix = Math.floor(20000 + Math.random() * 99999);
  const suffix = Math.floor(1000 + Math.random() * 9999);
  const dl = dlNumStr || 'C7289427';
  return `${prefix}${dl}${suffix}`;
}

