// constructor
var BTreeNode = function(tree, keys, children, parent) {
  var node = Object.create(BTreeNode.prototype);
  node.tree = tree;
  node.keys = keys || [];
  node.children = children || [];
  node.parent = parent || null;
  return node;
};

// Traverse tree until we find correct node to insert this value
// contains=true searches for node containing exact value
BTreeNode.prototype.traverse = function(value, contains) {
  if (this.keys.indexOf(value) > -1) return this;
  else if (this.isLeaf()) {
    if (contains) return false;
    else return this;
  } else {
    // find the correct downward path for this value
    for (var i = 0; i < this.keys.length; i++) {
      if (value < this.keys[i]) {
        return this.children[i].traverse(value, contains);
      }
    }
    return this.children[this.keys.length].traverse(value, contains);
  }
};

BTreeNode.prototype.traverse2 = function(value, contains, wholepath) {
  if (this.keys.indexOf(value) > -1) {
    if (!wholepath.includes(this)) wholepath.push(this);
    return this;
  } else if (this.isLeaf()) {
    if (contains) return false;
    else return this;
  } else {
    // find the correct downward path for this value
    if (!wholepath.includes(this)) wholepath.push(this);
    for (var i = 0; i < this.keys.length; i++) {
      if (value < this.keys[i]) {
        if (!wholepath.includes(this.children[i]))
          wholepath.push(this.children[i]);

        return this.children[i].traverse2(value, contains, wholepath);
      }
    }
    if (!wholepath.includes(this.children[this.keys.length]))
      wholepath.push(this.children[this.keys.length]);
    return this.children[this.keys.length].traverse2(
      value,
      contains,
      wholepath
    );
  }
};

BTreeNode.prototype.delete = function(value){
  var int = parseInt(value) || 0;
  this.keys.splice( this.keys.indexOf(int), 1 );
  this.keys.sort(function(a, b) {
    // sort numbers ascending
    if (a > b) return 1;
    else if (a < b) return -1;
    else return 0;
  });
}

BTreeNode.prototype.swapchildren = function(value,lowBound){
  var a = this.parent.children.length;
  for(var i=0;i<a;i++){
    if(this.parent.children[i].keys.includes(value)){
      if(i>0&&i<a-1){
        if(this.parent.children[i-1].keys.length>lowBound||this.parent.children[i+1].keys.length>lowBound){
          if(this.parent.children[i-1].keys.length>lowBound){

          }else{
            
          }
        }
      }else if(i==0){
        if(this.parent.children[i+1].keys.length>lowBound){
          console.log('success')
        }
      }else{
        if(this.parent.children[i-1].keys.length>lowBound){
          console.log('success')
        }
      }
    }
  }
}

BTreeNode.prototype.insert = function(value) {
  var int = parseInt(value) || 0;
  if (int <= 0 || int > 1000000000000) {
    Newalert("Please enter a valid integer.");
    return false;
  }

  // insert element
  this.keys.push(value);
  this.keys.sort(function(a, b) {
    // sort numbers ascending
    if (a > b) return 1;
    else if (a < b) return -1;
    else return 0;
  });

  // if overflow, handle overflow (go up)
  if (this.keys.length === this.tree.order) {
    this.handleOverflow();
  } else {
    // if not filled, start attaching children

    this.attachChildren();
  }
};

BTreeNode.prototype.handleOverflow = function() {
  tree = this.tree;

  // find this node's median and split into 2 new nodes
  median = this.splitMedian();

  // if no parent, create an empty one and set to root
  if (this.isRoot()) {
    tree.root = tree.createNode();
    this.setParent(tree.root);
  }

  // if node is internal, unattach children and add to unattached_nodes
  if (this.isInternal()) this.unattachAllChildren();

  // remove self from parent
  target = this.parent;
  this.unsetParent();

  // Push median up to target, increment offset
  tree.current_leaf_offset += 1;
  target.insert(median);
};

BTreeNode.prototype.insert2 = function(value) {
  var int = parseInt(value) || 0;
  if (int <= 0 || int > 1000000000000) {
    Newalert("Please enter a valid integer.");
    return false;
  }
  var insertPath = [];
  // insert element
  insertPath.push({"type":"addelement", "value":this.keys.slice(0)});
  this.keys.push(value);
  this.keys.sort(function(a, b) {
    // sort numbers ascending
    if (a > b) return 1;
    else if (a < b) return -1;
    else return 0;
  });
  insertPath.push({"type":"sortkeys", "value":this.keys.slice(0)});

  // if overflow, handle overflow (go up)
  if (this.keys.length === this.tree.order) {  
    insertPath.push(this.handleOverflow2());
  } else {
    // if not filled, start attaching children
    insertPath.push({"type":"attachchildren"});
    this.attachChildren();
  }
};

BTreeNode.prototype.handleOverflow2 = function() {
  tree = this.tree;

  // find this node's median and split into 2 new nodes
  median = this.splitMedian();

  // if no parent, create an empty one and set to root
  if (this.isRoot()) {
    tree.root = tree.createNode();
    this.setParent(tree.root);
  }

  // if node is internal, unattach children and add to unattached_nodes
  if (this.isInternal()) this.unattachAllChildren();

  // remove self from parent
  target = this.parent;
  this.unsetParent();

  // Push median up to target, increment offset
  tree.current_leaf_offset += 1;
  target.insert(median);
  return {"type":"splitnode", "value":{"median":median}}
};

// function to go down and reattach nodes
BTreeNode.prototype.attachChildren = function() {
  var target = this;
  var offset = target.tree.current_leaf_offset - 1;

  // get all nodes below the current node
  var target_nodes = target.tree.unattached_nodes[offset];

  if (target_nodes && target_nodes.length > 0) {
    // first, put all existing nodes into target_nodes so they're ordered correctly
    target.unattachAllChildren();

    // then, attach keys.length+1 children to this node
    for (var i = 0; i <= target.keys.length; i++) {
      target.setChild(target_nodes[0]);
      target.tree.removeUnattached(target_nodes[0], offset);
    }

    // lower offset, and repeat for each one of the children
    tree.current_leaf_offset -= 1;
    target.children.forEach(function(child) {
      child.attachChildren();
    });

    // come back up so upper levels can process appropriately
    tree.current_leaf_offset += 1;
  }
};

// helper function to split node into 2 and return the median
BTreeNode.prototype.splitMedian = function() {
  var median_index = parseInt(tree.order / 2);
  var median = this.keys[median_index];

  var leftKeys = this.keys.slice(0, median_index);
  var leftNode = tree.createNode(leftKeys); // no children or parent
  tree.addUnattached(leftNode, tree.current_leaf_offset);

  var rightKeys = this.keys.slice(median_index + 1, this.keys.length);
  var rightNode = tree.createNode(rightKeys);
  tree.addUnattached(rightNode, tree.current_leaf_offset);
  return median;
};

BTreeNode.prototype.setChild = function(node) {
  if (node) {
    this.children.push(node);
    node.parent = this;
  }
};
BTreeNode.prototype.unattachAllChildren = function() {
  var length = this.children.length;
  for (var i = 0; i < length; i++) {
    child = this.children[0];
    child.unsetParent();
    tree.addUnattached(child, tree.current_leaf_offset - 1);
  }
};

BTreeNode.prototype.setParent = function(node) {
  node.setChild(this);
};

BTreeNode.prototype.unsetParent = function() {
  var node = this;
  if (node.parent) {
    node.parent.children.forEach(function(child, index) {
      if (child === node) node.parent.children.splice(index, 1);
    });
    node.parent = null;
  }
};

BTreeNode.prototype.isRoot = function() {
  return this.parent === null;
};
BTreeNode.prototype.isLeaf = function() {
  return !this.children || this.children.length === 0;
};
BTreeNode.prototype.isInternal = function() {
  return !this.isLeaf() && !this.isRoot();
};

// generate node json, used in BTree::toJSON
BTreeNode.prototype.toJSON = function() {
  var json = {};
  json.name = this.keys.toString();
  if (!this.isRoot()) json.parent = this.parent.keys.toString();
  if (!this.isLeaf()) {
    json.children = [];
    this.children.forEach(function(child, index) {
      json.children.push(child.toJSON());
    });
  }
  return json;
};

function Newalert(e) {
  $("body").append(
    '<div id="msg"><div id="msg_top">Warning<span class="msg_close">×</span></div><div id="msg_cont">' +
      e +
      '</div><div class="msg_close" id="msg_clear">OK</div></div>'
  );
  $(".msg_close").click(function() {
    $("#msg").remove();
  });
}