/**
 * GEDCOM.js - A lightweight parser and analyzer for GEDCOM 5.5 files.
 */

class GEDCOMParser {
  constructor() {
    this.reset();
  }

  reset() {
    this.individuals = new Map();
    this.families = new Map();
    this.header = {};
  }

  parse(content) {
    const lines = content.split('\n');
    let stack = [];
    let currentObject = null;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      const match = line.match(/^(\d+)\s+(@\w+@)?\s*(\w+)\s*(.*)?$/);
      if (!match) continue;

      const level = parseInt(match[1]);
      const id = match[2];
      const tag = match[3];
      const data = match[4];

      const node = { tag, data, tree: [] };

      if (level === 0) {
        if (id) {
          if (tag === 'INDI') {
            currentObject = { id, tag, tree: [] };
            this.individuals.set(id, currentObject);
          } else if (tag === 'FAM') {
            currentObject = { id, tag, tree: [] };
            this.families.set(id, currentObject);
          }
        }
        stack = [currentObject];
      } else {
        while (stack.length > level) {
          stack.pop();
        }
        const parent = stack[stack.length - 1];
        if (parent) {
          parent.tree.push(node);
          stack.push(node);
        }
      }
    }
  }

  getIndividual(id) {
    return this.individuals.get(id);
  }

  getTag(node, tag) {
    return node.tree.find(n => n.tag === tag);
  }

  getName(indi) {
    const nameNode = this.getTag(indi, 'NAME');
    return nameNode ? nameNode.data.replace(/\//g, '').trim() : 'Unknown';
  }

  getBirthYear(indi) {
    const birt = this.getTag(indi, 'BIRT');
    if (birt) {
      const date = this.getTag(birt, 'DATE');
      if (date) {
        const year = date.data.match(/\d{4}/);
        return year ? year[0] : null;
      }
    }
    return null;
  }

  analyze() {
    const diagnostics = [];
    const nameMap = new Map();
    const stats = { high: 0, med: 0, low: 0 };

    for (let [id, indi] of this.individuals) {
      const name = this.getName(indi);
      const birthYear = this.getYear(this.getTag(indi, 'BIRT'));
      const deathYear = this.getYear(this.getTag(indi, 'DEAT'));
      const errors = [];

      // 1. HIGH: Possible Duplicates (Target: 603)
      // matching on name + approximate birth/death years or marriage
      const key = `${name.toLowerCase()}|${birthYear || '?'}`;
      if (nameMap.has(key)) {
        const original = nameMap.get(key);
        errors.push({ type: 'duplicate', msg: `❗ LVL 3: 🛑 DUPLICATE of ${original.name} (${original.years})`, severity: 3 });
        stats.high++;
      } else {
        nameMap.set(key, { id, name, years: `${birthYear || '?'}-${deathYear || '?'}` });
      }

      // 2. MEDIUM: Other Possible Errors / Logic (Target: 21)
      // Check Birth vs Death order
      if (birthYear && deathYear && parseInt(birthYear) > parseInt(deathYear)) {
        errors.push({ type: 'logic', msg: `🔴 LVL 2: ⚠️ LOGIC ERROR: Birth (${birthYear}) occurred after Death (${deathYear})`, severity: 2 });
        stats.med++;
      }

      // 3. LOW: No Documentation (Target: 2323)
      // Check for SOUR (Source) tags
      const hasSources = this.findAllTags(indi, 'SOUR').length > 0;
      if (!hasSources) {
        errors.push({ type: 'doc', msg: `ℹ️ LVL 1: ℹ️ DOCUMENTATION: No source records found for this individual`, severity: 1 });
        stats.low++;
      }

      // 4. LOW: Missing Locations (Optional Gap)
      const birt = this.getTag(indi, 'BIRT');
      if (birt && !this.getTag(birt, 'PLAC')) {
          errors.push({ type: 'gap', msg: `ℹ️ LVL 1: ℹ️ DATA GAP: Missing Birth location data`, severity: 1 });
          stats.low++;
      }

      if (errors.length > 0) {
        diagnostics.push({ id, name, birthYear, errors });
      }
    }

    return { diagnostics, stats };
  }

  getYear(node) {
    if (!node) return null;
    const date = this.getTag(node, 'DATE');
    if (date) {
      const year = date.data.match(/\d{4}/);
      return year ? year[0] : null;
    }
    return null;
  }

  findAllTags(node, tag) {
    let results = [];
    if (!node || !node.tree) return results;
    for (let child of node.tree) {
      if (child.tag === tag) results.push(child);
      results = results.concat(this.findAllTags(child, tag));
    }
    return results;
  }

  calculateScore() {
    let totalScore = 10;
    const { stats } = this.analyze();
    
    let totalPenalty = (stats.high * 0.8) + (stats.med * 0.3) + (stats.low * 0.1);
    
    // Scale penalty by tree size
    const scaledPenalty = Math.min(8, (totalPenalty / (this.individuals.size / 20)));
    return Math.max(0, totalScore - scaledPenalty).toFixed(1);
  }
}

if (typeof module !== 'undefined') {
  module.exports = GEDCOMParser;
}
