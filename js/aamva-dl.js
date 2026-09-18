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
  { code: 'Asian', name: 'Asian' },
  { code: 'American Indian/Alaskan Native', name: 'American Indian/Alaskan Native' },
  { code: 'Hispanic/Latino', name: 'Hispanic/Latino' },
  { code: 'Pacific Islander', name: 'Pacific Islander' },
  { code: 'Other', name: 'Other' },
  { code: 'Unknown', name: 'Unknown' }
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
    race: 'Black',

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
 * AAMVA Field Auto-Generator Suite (pdf417.pro equivalent calculator buttons)
 *
 * Each function generates a realistic, AAMVA-spec-compliant value.
 * DD and ICN are computed from related fields to stay internally consistent.
 */

// --- State-specific DL number format rules ---
const DL_NUM_FORMATS = {
  CA: () => { const l = _rLetter(); const n = _rInt(1000000, 9999999); return `${l}${n}`; },
  NY: () => { const n = _rInt(100000000, 999999999); return String(n); },
  TX: () => { const n = _rInt(10000000, 99999999); return String(n); },
  FL: () => { const l = _rLetter(); const n = _rInt(100000000000, 999999999999); return `${l}${n}`.substring(0,12); },
  IL: () => { const l = _rLetter(); const n = _rInt(100000000000, 999999999999); return `${l}${n}`.substring(0,12); },
  PA: () => { const n = _rInt(10000000, 99999999); return String(n); },
  OH: () => { const l1 = _rLetter(); const l2 = _rLetter(); const n = _rInt(100000, 999999); return `${l1}${l2}${n}`; },
  GA: () => { const n = _rInt(1000000, 9999999); return String(n).padStart(9, '0'); },
  NC: () => { const n = _rInt(1000000, 9999999); return String(n); },
  MI: () => { const l = _rLetter(); const n = _rInt(100000000000, 999999999999); return `${l}${n}`.substring(0,13); },
  NJ: () => { const l = _rLetter(); const n = _rInt(100000000000, 999999999999); return `${l}${n}`.substring(0,15); },
  VA: () => { const l = _rLetter(); const n = _rInt(10000000, 99999999); return `${l}${n}`; },
  WA: () => { const l1=_rLetter(),l2=_rLetter(),l3=_rLetter(); const n=_rInt(100000000,999999999); return `${l1}${l2}${l3}${n}`.substring(0,12); },
  AZ: () => { const l = _rLetter(); const n = _rInt(10000000, 99999999); return `${l}${n}`; },
  MA: () => { const l = _rLetter(); const n = _rInt(10000000, 99999999); return `${l}${n}`; },
  DEFAULT: () => { const l = _rLetter(); const n = _rInt(1000000, 9999999); return `${l}${n}`; }
};

// Renewal cycles in years by state
const RENEWAL_YEARS = {
  CA: 5, NY: 8, TX: 6, FL: 8, IL: 4, PA: 4, OH: 4, GA: 8, NC: 8,
  MI: 4, NJ: 4, VA: 8, WA: 6, AZ: 12, MA: 5, TN: 8, IN: 6, MO: 6,
  MD: 8, WI: 8, CO: 5, MN: 4, SC: 8, AL: 4, LA: 6, KY: 4, OR: 8,
  OK: 4, CT: 6, UT: 5, IA: 8, NV: 8, AR: 8, MS: 8, KS: 6, NM: 8,
  NE: 5, ID: 8, WV: 5, HI: 8, NH: 5, ME: 6, RI: 5, MT: 8, DE: 5,
  SD: 5, ND: 5, AK: 5, VT: 4, WY: 4, DC: 8, DEFAULT: 5
};

// Helpers
function _rLetter() {
  return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
}
function _rInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}
function _rPad(n, len) {
  return String(n).padStart(len, '0');
}

/**
 * Generates a state-formatted DL number
 * @param {string} stateCode  e.g. 'CA', 'NY'
 */
function getRandomDLNum(stateCode) {
  const fmt = DL_NUM_FORMATS[stateCode] || DL_NUM_FORMATS.DEFAULT;
  return fmt();
}

function getRandomFirstName(sex) {
  const male = ['James','John','Robert','Michael','William','David','Richard','Joseph','Thomas','Charles','Christopher','Daniel','Matthew','Anthony','Mark','Donald','Steven','Paul','Andrew','Kenneth','Joshua','Kevin','Brian','George','Timothy','Jason','Jeffrey','Ryan','Jacob','Gary','Nicholas','Eric','Jonathan','Stephen','Larry','Justin','Scott','Brandon','Benjamin','Samuel'];
  const female = ['Mary','Patricia','Jennifer','Linda','Barbara','Elizabeth','Susan','Jessica','Sarah','Karen','Lisa','Nancy','Betty','Margaret','Sandra','Ashley','Dorothy','Kimberly','Emily','Donna','Michelle','Carol','Amanda','Melissa','Deborah','Stephanie','Rebecca','Sharon','Laura','Cynthia','Kathleen','Amy','Angela','Shirley','Anna','Brenda','Pamela','Emma','Nicole','Helen'];
  const pool = sex === '2' ? female : male;
  return pool[Math.floor(Math.random() * pool.length)];
}

function getRandomLastName() {
  const names = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson','Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Adams','Baker','Nelson','Carter','Mitchell','Perez','Roberts','Turner','Phillips','Campbell','Evans','Parker'];
  return names[Math.floor(Math.random() * names.length)];
}

function getRandomMiddleName() {
  const names = ['William','Alexander','James','Edward','Joseph','Lee','Thomas','Charles','Michael','David','Alan','Ray','Wayne','Eugene','Scott','Francis','Paul','Anthony','Henry','Arthur','Lynn','Marie','Ann','Jean','Mae','Grace','Kay','Ruth','June','Joy'];
  return names[Math.floor(Math.random() * names.length)];
}

/**
 * Random DOB: age 18–70, safe for a valid adult DL
 */
function getRandomDOB() {
  const age = _rInt(18, 70);
  const today = new Date();
  const birthYear = today.getFullYear() - age;
  const birthMonth = _rInt(1, 12);
  const maxDay = new Date(birthYear, birthMonth, 0).getDate();
  const birthDay = _rInt(1, maxDay);
  return _rPad(birthMonth, 2) + _rPad(birthDay, 2) + birthYear;
}

/**
 * Generates an issue date: random recent date (1–5 years ago)
 */
function getRandomIssueDate() {
  const today = new Date();
  const yearsAgo = _rInt(1, 4);
  const issueDate = new Date(today.getFullYear() - yearsAgo, _rInt(0, 11), _rInt(1, 28));
  return _rPad(issueDate.getMonth() + 1, 2) + _rPad(issueDate.getDate(), 2) + issueDate.getFullYear();
}

/**
 * Calculates a proper expiry date:
 * - Expires on the holder's BIRTHDAY month+day (AAMVA standard)
 * - Adds the state renewal cycle (4–12 years) from issue year
 * @param {string} dobStr   MMDDYYYY
 * @param {string} stateCode  e.g. 'CA'
 * @param {string} issueDateStr  MMDDYYYY
 */
function getRandomExpDate(dobStr, stateCode, issueDateStr) {
  // Extract birth month/day
  let birthMM = '01', birthDD = '15';
  if (dobStr && dobStr.length === 8) {
    birthMM = dobStr.substring(0, 2);
    birthDD = dobStr.substring(2, 4);
  }

  // Get issue year
  let issueYear = new Date().getFullYear();
  if (issueDateStr && issueDateStr.length === 8) {
    issueYear = parseInt(issueDateStr.substring(4, 8), 10);
  }

  // Get renewal cycle
  const renewalYears = RENEWAL_YEARS[stateCode] || RENEWAL_YEARS.DEFAULT;
  const expYear = issueYear + renewalYears;

  return `${birthMM}${birthDD}${expYear}`;
}

/**
 * Calculates a realistic Document Discriminator (DCF).
 * Format: MM/DD/YYYY + 5-digit-sequence + / + IIN-prefix + 4-char-code
 * Based on real AAMVA DCF patterns observed in production barcodes.
 * @param {string} issueDateStr  MMDDYYYY
 * @param {string} iinStr  e.g. '636000'
 * @param {string} dlNumStr
 */
function getRandomDD(issueDateStr, iinStr, dlNumStr) {
  // Parse issue date into MM/DD/YYYY format
  let formattedDate;
  if (issueDateStr && issueDateStr.length === 8) {
    const mm = issueDateStr.substring(0, 2);
    const dd = issueDateStr.substring(2, 4);
    const yyyy = issueDateStr.substring(4, 8);
    formattedDate = `${mm}/${dd}/${yyyy}`;
  } else {
    const now = new Date();
    formattedDate = `${_rPad(now.getMonth()+1,2)}/${_rPad(now.getDate(),2)}/${now.getFullYear()}`;
  }

  // Use last 3 digits of IIN as a prefix component
  const iinSuffix = iinStr ? iinStr.substring(3, 6) : _rPad(_rInt(0, 999), 3);

  // Derive a pseudo-unique sequence number from DL number
  let seqBase = 10000;
  if (dlNumStr) {
    // Hash DL number chars into a numeric offset
    for (let i = 0; i < dlNumStr.length; i++) {
      seqBase += dlNumStr.charCodeAt(i) * (i + 7);
    }
    seqBase = (seqBase % 89999) + 10000;
  } else {
    seqBase = _rInt(10000, 99999);
  }

  // Audit code portion (state-doc-sequence suffix)
  const auditCode = `AAFD/${_rPad(_rInt(10, 99), 2)}`;

  return `${formattedDate}${iinSuffix}${seqBase}/${auditCode}`;
}

/**
 * Calculates a realistic Inventory Control Number (DCK).
 * Format varies by state; common pattern: IIN + DL# + MMYYYY (issue month/year)
 * @param {string} dlNumStr
 * @param {string} iinStr  e.g. '636000'
 * @param {string} issueDateStr  MMDDYYYY
 */
function getRandomICN(dlNumStr, iinStr, issueDateStr) {
  const iin = iinStr || '636000';
  const dl = (dlNumStr || 'D1234567').toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Date suffix: MMYYYY from issue date
  let dateSuffix;
  if (issueDateStr && issueDateStr.length === 8) {
    const mm = issueDateStr.substring(0, 2);
    const yyyy = issueDateStr.substring(4, 8);
    dateSuffix = mm + yyyy;
  } else {
    const now = new Date();
    dateSuffix = _rPad(now.getMonth() + 1, 2) + now.getFullYear();
  }

  // Checksum digit (simple mod-10 of DL char codes)
  let checksum = 0;
  for (let i = 0; i < dl.length; i++) checksum += dl.charCodeAt(i);
  checksum = checksum % 10;

  return `${iin}${dl}${dateSuffix}${checksum}`;
}

// Legacy compatibility alias (called by randomizeAllDLFields for simple random address)
function getRandomAddress() {
  const streets = ['Maple St','Oak Ave','Pine Rd','Cedar Blvd','Elm Dr','Sunset Blvd','Main St','Park Ave','Lake Dr','Hill Rd','Valley Rd','River St','Forest Ave','Washington Blvd','Lincoln Ave'];
  const houseNo = _rInt(100, 9999);
  return `${houseNo} ${streets[Math.floor(Math.random() * streets.length)]}`;
}

const CITY_ZIP_BY_STATE = {
  CA: [['Los Angeles','90001'],['San Francisco','94102'],['San Diego','92101'],['Sacramento','95814'],['Rohnert Park','94928']],
  NY: [['New York','10001'],['Buffalo','14201'],['Albany','12201'],['Rochester','14601'],['Yonkers','10701']],
  TX: [['Houston','77001'],['Dallas','75201'],['Austin','78701'],['San Antonio','78201'],['El Paso','79901']],
  FL: [['Miami','33101'],['Orlando','32801'],['Tampa','33601'],['Jacksonville','32201'],['Tallahassee','32301']],
  IL: [['Chicago','60601'],['Rockford','61101'],['Springfield','62701'],['Aurora','60505'],['Naperville','60540']],
  DEFAULT: [['Springfield','62701'],['Riverside','92501'],['Franklin','37064'],['Clinton','52732'],['Georgetown','40324']]
};

function getRandomCityZip(stateCode) {
  const pool = CITY_ZIP_BY_STATE[stateCode] || CITY_ZIP_BY_STATE.DEFAULT;
  return pool[Math.floor(Math.random() * pool.length)];
}
