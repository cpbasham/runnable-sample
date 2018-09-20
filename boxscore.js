const cheerio = require('cheerio');
import { NUM_STARTERS } from './constants';
import {
  getFirstData,
  extractHeaders,
  extractEntries,
  getChildTags,
} from './utils/html-helpers';
import { grabContent } from './utils/index';

const BASE_URL = 'https://www.basketball-reference.com'
const BOX_SCORES_PATH = '/boxscores/[key].html'

const FOUR_FACTORS_SELECTOR = 'table#four_factors tbody tr';
const LINE_SCORE_SELECTOR = 'table#line_score tbody tr';

(function main() {
  let args = process.argv.slice(2);
  if (!args[0]) {
    console.error("Basketball-reference boxscore url required as argument");
  } else {
    let boxscore = getBoxScoreForGame(args[0]);
    console.log("BOX SCORE:");
    boxscore.then((stats) => console.log(stats));
  }
})();

export async function getBoxScoreForGame(boxScoreUrl) {
  const res = await grabContent(boxScoreUrl);
  const $ = cheerio.load(res);
  const teams = getTeams($);
  let out = {
    line_score: getLineScore($),
    four_factors: getFourFactors($)
  }
  out[teams[0]] = getPlayerStats($, teams[0]);
  out[teams[1]] = getPlayerStats($, teams[1]);
  return out;
}

function getFourFactors($) {
  const table = $('table#four_factors');
  const [headerRowNode, ...entryNodes] = $('tbody tr', table).toArray();
  const headers = extractHeaders(headerRowNode, 'Team');
  const entries = extractEntries(entryNodes);
  return getTableEntryObjects(headers, entries);
}

function getLineScore($) {
  const table = $('table#line_score');
  const [headerRowNode, ...entryNodes] = $('tbody tr', table).toArray();
  const headers = extractHeaders(headerRowNode, 'Team');
  const entries = extractEntries(entryNodes);
  return getTableEntryObjects(headers, entries);
}

function getPlayerStats($, team) {
  const tableNodes = getPlayerStatTableNodes($, team);
  return combinePlayerStatEntries(extractPlayerStats($, tableNodes.basic),
                                  extractPlayerStats($, tableNodes.advanced));
}

// Assumes number of entries is same between basic & advanced
function combinePlayerStatEntries(basicEntries, advEntries) {
  if (basicEntries.length !== advEntries.length) { throw 'Basic Player Entries and Advanced Player Entries do not match in length.'}
  let fullEntries = [];
  for (let i=0; i<basicEntries.length; i++) {
    let basic = basicEntries[i];
    let name = basic.Player;
    let advanced = advEntries.filter(e => e.Player === name)[0];
    fullEntries.push(Object.assign({}, basic, advanced));
  }
  return fullEntries;
}

function getPlayerStatTableNodes($, team) {
  team = team.toLowerCase();
  return {
    basic: $(`#box_${team}_basic`)[0],
    advanced: $(`#box_${team}_advanced`)[0]
  };
}

function extractPlayerStats($, table) {
  const headerRowNode = $('thead tr', table).toArray()[1];
  const numEntryColumns = getChildTags(headerRowNode).length;
  let entryNodes = $('tbody tr', table).toArray();
  entryNodes = entryNodes.filter(isEntryNode(numEntryColumns));
  let headers = extractHeaders(headerRowNode, 'Player');
  const entries = extractEntries(entryNodes);
  return getTableEntryObjects(headers, entries);
}

function getTeams($) {
  const isPlayoff = $('#all_other_scores .game_summaries').hasClass('playoffs');
  const table = $('#all_other_scores .game_summary.current table');
  const teamNodes = $('tbody tr', table).toArray();
  if (isPlayoff) {
    // team nodes html is structured differently during playoffs
    const winner = getFirstData(teamNodes[1]);
    const loser = getFirstData(teamNodes[2]);
    return [ winner, loser ];

  } else {
    return teamNodes.map(getFirstData);
  }
}

function getTableEntryObjects(headers, dataRows) {
  return dataRows.map(getTableEntryObject.bind(null, headers));
}

function getTableEntryObject(headers, entry) {
  if (headers.length !== entry.length) {
    throw 'headers and entry are of different lengths: \n' + headers + '\n' + entry;
  }
  let out = {};
  headers.forEach((header, i) => out[header] = entry[i]);
  return out;
}

function isEntryNode(numEntryColumns) {
  return (node, index) => {
    return index !== NUM_STARTERS && getChildTags(node).length === numEntryColumns;
  }
}
