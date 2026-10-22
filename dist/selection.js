// A logical group links objects without reparenting imported PDF elements.
// Their transforms, clipping, inherited styles and paint order remain intact.
export function selectionUnits(elements) {
  const units = [];
  const linked = new Map();
  for (const element of elements) {
    const key = element.dataset.group;
    if (!key) { units.push([element]); continue; }
    if (!linked.has(key)) { const unit = []; linked.set(key, unit); units.push(unit); }
    linked.get(key).push(element);
  }
  return units;
}

export function linkedMembers(element, all) {
  const key = element.dataset.group;
  return key ? all.filter(candidate => candidate.dataset.group === key) : [element];
}

export function expandSelection(elements, all) {
  const result = new Set();
  for (const element of elements) for (const member of linkedMembers(element, all)) result.add(member);
  return [...result];
}

export function groupElements(elements, key) {
  if (elements.length < 2) return false;
  for (const element of elements) element.dataset.group = key;
  return true;
}

export function ungroupElements(elements) {
  for (const element of elements) delete element.dataset.group;
}

export function remapCloneGroups(elements, nextId) {
  const keys = new Map();
  for (const element of elements) {
    for (const node of [element, ...element.querySelectorAll('[data-group]')]) {
      const key = node.dataset.group;
      if (!key) continue;
      if (!keys.has(key)) keys.set(key, nextId());
      node.dataset.group = keys.get(key);
    }
  }
  return elements;
}
