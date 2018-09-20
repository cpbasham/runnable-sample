export function getFirstData(node) {
  if (node.data && node.data.trim()) {
    return node.data.trim();
  } else if (node.children) {
    return getFirstData(node.children);
  } else if (node instanceof Array) {
    for (let i=0; i<node.length; i++) {
      const data = getFirstData(node[i]);
      if (data) { return data }
    }
  }
  return null;
}

/**
 *  Will return string that, when evaluated, produces an ancestor node with the given ancestor name.
 *
 *  ex output: `node.parent.parent.parent`
 *  @param {Object} node - a child node in search of its ancestry.
 *  @param {String} ancestorName - the name to use when comparing ancestor nodes.
 *  @param {Number} maxDistance - the maximum distance to climb up a nodes ancestry.
 */
function getNodeAncestryUsingName({ node, ancestorName, maxDistance = 100 }) {
  let familyTree = `node`;
  if (!node.hasOwnProperty('parent')) return familyTree;

  let ancestor = { name: '' };
  let distanceTravelled = 0;
  while (ancestor.name !== ancestorName && maxDistance > distanceTravelled ) {
    // climb up the family tree
    familyTree += `.parent`;
    ancestor = eval(familyTree);
    distanceTravelled++;
  }

  return familyTree;
}

/**
 *  Similar to getFirstData but this will find the nth data of a commonAncestor.
 */
export function getNData(node, { n, commonAncestorName }) {
  return getFirstData(getNNode(node, { n, commonAncestorName }));
}


/**
 *  Similar to getFirstData but this will find the nth node of a commonAncestor.
 */
export function getNNode(node, { n, commonAncestorName }) {
  if (node.data && node.data.trim()) {
    try {
      const ancestry = getNodeAncestryUsingName({ node, ancestorName: commonAncestorName })
      const ancestor = eval(ancestry);
      return ancestor.children[n];
    } catch (e) {
      console.error("Function getNNode encountered a parsing issue.");
      console.error(`Tried child ${n} in this nodes ancestry chain: ${node}`);
    }
  } else if (node.children) {
    return getNNode(node.children, { n, commonAncestorName });
  } else if (node instanceof Array) {
    for (let i=0; i<node.length; i++) {
      const realNode = getNNode(node[i], { n, commonAncestorName });
      if (realNode) { return realNode; }
    }
  }
  return null;
}

export function getNLink(node, { n, commonAncestorName }){
  return getFirstLink(getNNode(node, { n, commonAncestorName }));
}
export function getFirstLink(node){
  if (node.data && node.data.trim()) {
    const ancestry = getNodeAncestryUsingName({ node, ancestorName: 'a' })
    const ancestor = eval(ancestry);
    return ancestor.attribs.href;
  } else if (node.children) {
    return getFirstLink(node.children);
  } else if (node instanceof Array) {
    for (let i=0; i<node.length; i++) {
      const data = getFirstLink(node[i]);
      if (data) { return data }
    }
  }
  return null;
}


export function extractHeaders(row, firstHeader=null) {
  let headers = getChildTags(row).filter(isDisplayed).map(extractHeader);
  if (firstHeader) {
    headers[0] = firstHeader;
  }
  return headers;
}


export function extractEntries(entryNodes) {
  return entryNodes.map(extractEntry);
}




export function getChildTags(node) {
  const children =  node.children ? node.children.filter
                                  ? node.children
                                  : node.children().toArray()
                                : [];
  return children.filter(isTag); // ;-)
}

export function getHref(a) {
  return a.attribs['href'];
}

function extractEntry(entryNode) {
  return getChildTags(entryNode).filter(isDisplayed).map(getFirstData);
}

function extractHeader(th) {
  const ariaLabel = getAttribute(th, 'aria-label');
  return ariaLabel ? ariaLabel : getFirstData(th);
}

function isTag(node) {
  return node.type === 'tag';
}

function isHidden(node) {
  const classes = getAttribute(node, 'class');
  return (classes && classes.includes('ng-hide')) || getAttribute(node, 'aria-hidden') === 'true'
}

function isDisplayed(node) {
  return !isHidden(node);
}

function getAttribute(node, attr) {
  return node.attribs[attr];
}
