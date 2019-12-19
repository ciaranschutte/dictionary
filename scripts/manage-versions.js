const axios = require('axios');
const chalk = require('chalk');
const inquirer = require('inquirer');
const querystring = require('querystring');
const fs = require('fs');
const argv = require('yargs').argv;

const apiRoot = 'https://lectern.dev.argo.cancercollaboratory.org';
const dictionaryName = 'ICGC-ARGO Data Dictionary';
const schemaPath = '../website/static/data/schemas';
const versionsFilename = `${schemaPath}/schema-versions.json`;
const dataFilename = '../website/src/pages/dictionary/data.json';
const currentVersions = require(versionsFilename);

/* Util Functions */

function ensureDirectoryExistence(path) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
}

function printConfig() {
  console.log(`${chalk.yellow('Lectern Root')}: ${apiRoot}`);
  console.log(`${chalk.yellow('Dictionary Name')}: ${dictionaryName}`);
}

async function printVersionsLists() {
  const versions = await fetchDictionaryVersionsList();

  const newVersions = versions.filter(item => !currentVersions.includes(item));

  console.log(`\n${chalk.yellow('All Versions')}: ${versions.join(', ')}`);
  console.log(`${chalk.yellow('Current Versions')}: ${currentVersions.join(', ')}`);
  console.log(`\n${chalk.yellow('New Versions')}: ${newVersions.join(', ')}`);
  return newVersions;
}

function saveDictionaryFile(version, data) {
  const filename = `${schemaPath}/${version}.json`;
  fs.writeFileSync(filename, JSON.stringify(data));
}

function saveVersionsFile(data) {
  fs.writeFileSync(versionsFilename, JSON.stringify(data));
}

// The data file is the file used on load in the data dictionary.
function saveDataFile(dictionary, versions) {
  const content = {
    dictionary,
    versions,
    currentVersion: versions[0],
  };
  fs.writeFileSync(dataFilename, JSON.stringify(content));
}

async function fetchAndSaveDiffsForVersion(version) {
  for (let i = 0; i < currentVersions.length; i++) {
    const otherVersion = currentVersions[i];

    // Ternary with comparison instead of min/max to avoid removing the decimal when the version has a .0
    const high = parseFloat(version) > parseFloat(otherVersion) ? version : otherVersion;
    const low = parseFloat(version) < parseFloat(otherVersion) ? version : otherVersion;

    const path = `${schemaPath}/diffs/${high}`;
    const filename = `${path}/${high}-diff-${low}.json`;

    try {
      ensureDirectoryExistence(path);
      const response = await fetchDiffForVersions(high, low);
      console.log(
        `${chalk.cyan('saving diff for versions')} ${high} ${chalk.cyan('and')} ${low} ${chalk.cyan(
          '...',
        )}`,
      );
      fs.writeFileSync(filename, JSON.stringify(response));
    } catch (e) {
      console.log(chalk.red(`Error fetching or saving diff!`));
    }
  }
}

/* Lectern API */

async function fetchDictionaryVersionsList() {
  console.log(chalk.cyan('\nfetching dictionary versions list...'));
  const response = await axios.get(`${apiRoot}/dictionaries`);
  return response.data
    .filter(item => item.name === dictionaryName)
    .map(item => item.version)
    .sort((a, b) => (a.version > b.version ? 1 : -1));
}

async function fetchDictionaryForVersion(version) {
  console.log(`${chalk.cyan('\nfetching dictionary for version')} ${version} ${chalk.cyan('...')}`);
  const response = await axios.get(
    `${apiRoot}/dictionaries?${querystring.stringify({ name: dictionaryName, version })}`,
  );
  return response.data[0];
}

async function fetchDiffForVersions(left, right) {
  console.log(
    `${chalk.cyan('\nfetching diff for versions')} ${left} ${chalk.cyan(
      'vs',
    )} ${right} ${chalk.cyan('...')}`,
  );
  const response = await axios.get(
    `${apiRoot}/diff?${querystring.stringify({ name: dictionaryName, left, right })}`,
  );
  return response.data;
}

/* User Prompts */

async function userSelectVersion(versions) {
  console.log('\n');
  return new Promise(resolve =>
    inquirer
      .prompt([
        { message: 'Select version to add:', name: 'version', type: 'list', choices: versions },
      ])
      .then(answers => resolve(answers.version)),
  );
}

/* SCRIPT MODES */
function runList() {
  console.log(chalk.green(`Listing all available dictionary versions:`));
  printConfig();
  printVersionsLists();
}

async function runAdd() {
  console.log(chalk.green(`Lets add a new dicitonary version!`));
  printConfig();
  console.log(chalk.green(`\nListing all available dictionary versions:`));
  const newVersions = await printVersionsLists();

  // User select a version
  const selectedVersion = await userSelectVersion(newVersions);

  // Fetch the dictionary for this version and save
  const dictionary = await fetchDictionaryForVersion(selectedVersion);
  saveDictionaryFile(selectedVersion, dictionary);
  console.log(chalk.cyan('dictionary saved...'));

  // Fetch all Diffs and save
  console.log(chalk.cyan('fetching diffs vs stored versions...'));
  await fetchAndSaveDiffsForVersion(selectedVersion);

  // Update versions file
  const updatedVersions = currentVersions
    .concat(selectedVersion)
    .sort((a, b) => (parseFloat(a) < parseFloat(b) ? 1 : -1));
  console.log(chalk.cyan('\nupdating list of data dictionary versions...'));
  saveVersionsFile(updatedVersions);

  console.log(chalk.cyan('\nupdating data dictionary input file...'));
  saveDataFile(dictionary, updatedVersions);

  console.log(chalk.green('\n\nALL CHANGES COMPLETE :D'));
}

function runHelp() {
  if (argv.npm) {
    console.log(`${chalk.yellow('--=')} Data Dictionary Scripts Help ${chalk.yellow('=--')}\n\n`);
    console.log(
      `${chalk.green(
        'npm run list',
      )} \t- Display list of available dictionary versions from lectern, \n\t\t   along with list of all versions that are not yet downloaded to the Data Dictionary.`,
    );
    console.log(
      `${chalk.green(
        'npm run add',
      )} \t- Select a dictionary version to add to the data dictionary.`,
    );
    console.log('\n');
  } else {
    console.log(`NODE HELP MENU`);
    console.log('\n');
  }
}

function run() {
  if (argv.l || argv.list) {
    // LIST ALL VERSIONS
    runList();
  } else if (argv.a || argv.add) {
    // ADD A NEW VERSION (first list all to show, then query the add)
    runAdd();
  } else {
    // HELP MENU
    runHelp();
  }
}

// MAIN!
run();