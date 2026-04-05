/**
 * GEDCOM.js - A lightweight parser and analyzer for GEDCOM 5.5 files.
 * Correctly builds a tree structure for robust record analysis.
 */

class GEDCOMParser {
  constructor() {
    this.reset();
  }

  reset() {
    this.individuals = new Map();
    this.families = new Map();
    this.header = null;
  }

  parse(content) {
    const lines = content.split('\n');
    let stack = [];

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      const match = line.match(/^(\d+)\s+(@\w+@)?\s*(\w+)\s*(.*)?$/);
      if (!match) continue;

      const level = parseInt(match[1]);
      const id = match[2];
      const tag = match[3];
      const data = match[4] || '';

      const node = { tag, data, tree: [] };

      if (level === 0) {
        if (tag === 'INDI' && id) {
          this.individuals.set(id, node);
          stack = [node];
        } else if (tag === 'FAM' && id) {
          this.families.set(id, node);
          stack = [node];
        } else if (tag === 'HEAD') {
          this.header = node;
          stack = [node];
        } else {
          stack = [node];
        }
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

  getTag(node, tag) {
    if (!node || !node.tree) return null;
    return node.tree.find(n => n.tag === tag);
  }

  findAllTags(node, tag) {
    let results = [];
    if (!node || !node.tree) return results;
    for (let child of node.tree) {
      if (child.tag === tag) results.push(child);
    }
    return results;
  }

  getName(indi) {
    if (!indi) return 'Unknown';
    const nameNode = this.getTag(indi, 'NAME');
    return nameNode ? nameNode.data.replace(/\//g, '').trim() : 'Unknown';
  }

  getYear(node) {
    if (!node) return null;
    const dateNode = this.getTag(node, 'DATE');
    if (dateNode) {
      const yearMatch = dateNode.data.match(/\d{4}/);
      return yearMatch ? yearMatch[0] : null;
    }
    return null;
  }

  analyze() {
    const diagnostics = [];
    const nameMap = new Map();
    const stats = { high: 0, med: 0, low: 0 };

    for (let [id, indi] of this.individuals) {
      const name = this.getName(indi);
      const birthNode = this.getTag(indi, 'BIRT');
      const deathNode = this.getTag(indi, 'DEAT');
      const birthYear = this.getYear(birthNode);
      const deathYear = this.getYear(deathNode);
      const errors = [];

      // 1. HIGH: Possible Duplicates
      // Requires a known name AND a known birth year, otherwise too many false positives.
      const key = (name !== 'Unknown' && birthYear) ? `${name.toLowerCase()}|${birthYear}` : null;
      if (key && nameMap.has(key)) {
        const original = nameMap.get(key);
        errors.push({ 
          type: 'duplicate', 
          msg: `❗ LVL 3: 🛑 DUPLICATE of ${original.name} (${original.years})`, 
          severity: 3,
          originalId: original.id 
        });
        stats.high++;
      } else if (key) {
        nameMap.set(key, { id, name, years: `${birthYear || '?'}-${deathYear || '?'}` });
      }

      // 2. MEDIUM: Logic Errors
      if (birthYear && deathYear && parseInt(birthYear) > parseInt(deathYear)) {
        errors.push({ type: 'logic', msg: `⚠️ LVL 2: ⚠️ LOGIC ERROR: Birth (${birthYear}) occurred after Death (${deathYear})`, severity: 2 });
        stats.med++;
      }

      if (errors.length > 0) {
        diagnostics.push({ id, name, birthYear, errors });
      }
    }

    return { diagnostics, stats };
  }

  getFullRecord(id) {
    const indi = this.individuals.get(id);
    if (!indi) return null;

    const data = {
      id,
      name: this.getName(indi),
      events: [],
      family: { parents: [], spouses: [] },
      sources: this.findAllTags(indi, 'SOUR').map(s => s.data)
    };

    // Life Events
    const eventTypes = ['BIRT', 'DEAT', 'BURI', 'CHR', 'RESI', 'MARR', 'GRAD', 'OCCU'];
    eventTypes.forEach(type => {
      const node = this.getTag(indi, type);
      if (node) {
        data.events.push({
          type,
          date: this.getTag(node, 'DATE')?.data || 'Unknown',
          place: this.getTag(node, 'PLAC')?.data || 'Unknown'
        });
      }
    });

    // Family Links
    this.findAllTags(indi, 'FAMC').forEach(ref => {
      const fam = this.families.get(ref.data);
      if (fam) {
        const husbId = this.getTag(fam, 'HUSB')?.data;
        const wifeId = this.getTag(fam, 'WIFE')?.data;
        if (husbId) data.family.parents.push({ role: 'Father', name: this.getName(this.individuals.get(husbId)) });
        if (wifeId) data.family.parents.push({ role: 'Mother', name: this.getName(this.individuals.get(wifeId)) });
      }
    });

    this.findAllTags(indi, 'FAMS').forEach(ref => {
      const fam = this.families.get(ref.data);
      if (fam) {
        const spouseId = (this.getTag(fam, 'HUSB')?.data === id) ? this.getTag(fam, 'WIFE')?.data : this.getTag(fam, 'HUSB')?.data;
        if (spouseId) {
          const spouse = { name: this.getName(this.individuals.get(spouseId)), children: [] };
          this.findAllTags(fam, 'CHIL').forEach(chil => {
            const childIndi = this.individuals.get(chil.data);
            if (childIndi) spouse.children.push(this.getName(childIndi));
          });
          data.family.spouses.push(spouse);
        }
      }
    });

    return data;
  }

  calculateScore() {
    const stats = this.analyze().stats;
    const totalPenalty = (stats.high * 0.8) + (stats.med * 0.3);
    const scaledPenalty = Math.min(8, (totalPenalty / (this.individuals.size / 20 || 1)));
    return Math.max(0, 10 - scaledPenalty).toFixed(1);
  }
}

if (typeof module !== 'undefined') {
  module.exports = GEDCOMParser;
}
