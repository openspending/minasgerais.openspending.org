var OpenSpending = OpenSpending || {};

(function ($) {
  var defaultConfig = {
    siteUrl: 'http://openspending.org',
    dataset: 'cra',
    drilldowns: ['cofog1', 'cofog2', 'cofog3'],
    cuts: ['year:2008'],
    breakdown: 'region',
    rootNodeLabel: 'Grant Total',
    localApiCache: 'aggregate.json',
    callback: function (tree) {}
  };

  OpenSpending.aggregatorConfigFromQueryString = function(queryString) {
    if (queryString) {
      var parts = parseQueryString(queryString);
    } else {
      var parts = parseQueryString();
    }
    var out = {};
    _.each(parts, function(item) {
      var key = item[0];
      var value = item[1];
      if (key == 'breakdown') {
        out.breakdown = value;
      } else if (key == 'drilldown') {
        out.drilldowns = value.split('|');
      } else if (key == 'cut') {
        out.cuts = value.split('|');
      }
    });
    return out;
  };

  OpenSpending.Aggregator = function (customConfig) {
    var d = {
      config: customConfig ? customConfig : defaultConfig,
      /**
       * Call the OpenSpending aggregate api function (/api/aggregate)
       * and build a tree that can be used by for the bubble charts
       *
       * @public getTree
       *
       * @param {string} api_url The url to the api,
       * e.g. 'http://openspending.org/api'
       * @param {string} dataset The name of the dataset, e.g. 'cra'
       * @param {array} drilldowns the dimensions to drill down to, e.g.
       * ['cofog1', 'cofog2', 'cofog3']
       * @param {array} cuts (optional) The array with cuts, each element in the
       * format 'key:value', e.g. ['time.from.year:2010']
       * @param {function} callback A function that will accept the root node
       * and builds the bubble chart.
       * @param {object} testDataPath (optional) An object with json (not jsonp)
       * test data. For testing only.
       **/
      getTree: function () {
        //api_url, dataset, drilldowns, cuts, callback, testDataPath
        //construct the url
        var data = {},
          dataType = 'jsonp',
          url, config = this.config,
          drilldowns;

        apiUrl = config.apiUrl || config.siteUrl + '/api';
        url = apiUrl + '/2/aggregate';
        data.dataset = config.dataset;
        data.drilldown = config.drilldowns.join('|');

        if (config.cuts !== undefined) {
          data.cut = config.cuts.join('|');
        }

        // add an optional breakdown to drilldowns to query the api
        drilldowns = config.drilldowns.slice(); //copy
        if (config.breakdown !== undefined && config.breakdown.length) {
          drilldowns.push(config.breakdown);
        }
        drilldowns = $.unique(drilldowns);
        data.drilldown = drilldowns.join('|');

        if (config.localApiCache !== undefined) {
          url = config.localApiCache;
          dataType = 'json';
        }
        $.ajax({
          url: url,
          data: data,
          dataType: dataType,
          context: this,
          success: this.onJSONTreeLoaded
        });
      },
      /**
       * 
       *
       */
      onJSONTreeLoaded: function (data) {
        var tree = this.buildTree(data);
        if ($.isFunction(this.config.callback)) {
          this.config.callback(tree);
        }
      },

      /**
       * Build a tree form the drill down entries
       *
       * @public buildTree
       *
       * @param {object} data The json object responded from the
       * aggregate api.
       * @param {array} drilldowns List of drilldown criteria (strings)
       * @param {object} rootNode (optional) Pass an object with properties
       * for the root node. Maybe you want to set 'color' (default: #555) or
       * the 'label' (default: 'Total')
       **/
      buildTree: function (data) {
        var entries = data.drilldown,
          config = this.config,
          drilldowns = config.drilldowns,
          breakdown = config.breakdown,
          rootNode = {
            label: config.rootNodeLabel
          },
          nodes = {},
          root = {
            id: 'root',
            label: 'Total',
            color: '#555',
            amount: 0.0,
            children: [],
            level: 0,
            breakdowns: {}
          };

        if (rootNode !== undefined) {
          // extend root with the properties of rootNode
          $.extend(true, root, rootNode);
        }
        nodes.root = root;

        for (var i in drilldowns) {
          var drilldown = drilldowns[i];
          nodes[drilldown] = {};
        }
        if (data.errors !== undefined) {
          throw "Error";
        }

        for (var index in entries) {
          this.processEntry(entries[index], nodes);

        }

        return nodes.root;

      },
      processEntry: function (entry, nodes) {
        var parent = nodes.root,
          level = 0,
          drilldown, drilldowns = this.config.drilldowns,
          current, node, node_template;


        for (var index in drilldowns) {
          drilldown = drilldowns[index];

          level = level + 1;
          current = entry[drilldown];
          node_template = this.toNode(current, parent);
          node = nodes[node_template.id];
          if (node === undefined) {
            // Initialize a new node and add it to the parent node
            node = node_template;
            node.children = [];
            node.amount = 0.0;
            node.color = current ? current.color : undefined;
            node.level = level;
            node.breakdowns = {};
            parent.children.push(node);
            nodes[node.id] = node;
          }

          node.amount = node.amount + entry.amount;

          // Add the current amount and the breakdown to the root node
          // to have a total.
          if (level === 1) {
            nodes.root.amount = nodes.root.amount + entry.amount;
            this.addBreakdown(nodes.root, entry);
          }

          // update the breakdown for the current node
          this.addBreakdown(node, entry);
          parent = node;
        }
      },
      /**
       *  Add a node for each drilldown to the 'nodes' object
       *  Process the nodes to have:
       *  * The summed up amount
       *  * A children array
       *  * A color property
       *  * An unique id
       *
       *  @method processEntry
       *  @param {object} entry The entry in the list of drill downs
       *  @param {object} node The node to which we save the breakdown
       *  @return {undefined}
       */
      addBreakdown: function (node, entry) {
        var breakdown = this.config.breakdown;
        if (breakdown === undefined) {

          return;
        }

        var breakdown_value, breakdown_node, node_template, nodes = {},
          id;
        breakdown_value = entry[breakdown];
        node_template = this.toNode(breakdown_value);
        id = node_template.id;
        breakdown_node = node.breakdowns[id];
        if (breakdown_node === undefined) {
          breakdown_node = node_template;
          node.breakdowns[id] = breakdown_node;
        }
        breakdown_node.amount = breakdown_node.amount + entry.amount;


      },
      toNode: function (value, parent) {
        var type = typeof (value);

        var node = {};
        prefix = parent ? parent.id + '__' : '';
        if (value === undefined || value === null) {
          node.id = 'others';
          node.label = 'Others';
          node.name = 'others';
        } else if (type === 'object') {
          if (value.id === undefined) {
            node.id = 'others';
            node.label = 'Others';
            node.name = 'others';
          } else {
            node = value;
            if (!node.name) {
              if (node.label) {
                node.name = node.label.toLowerCase().replace(/\W/g, "-");
              } else {
                node.name = node.id;
              }
            }
          }
        } else if (type === 'boolean') {
          if (value) {
            node.id = 'yes';
            node.label = 'Yes';
            node.name = 'yes';
          } else {
            node.id = 'no';
            node.label = 'No';
            node.name = 'no';
          }
        } else if (type === 'string' || type === 'number') {
          node.id = value + '';
          node.label = value + '';
          node.name = id.toLowerCase().replace(/\W/g, "-");
        } else {
          throw 'unsupported type: ' + type;
        }
        node.id = prefix + node.id;
        node.amount = 0.0;
        return node;
      }
    };
    d.getTree();
  };

}(jQuery));
