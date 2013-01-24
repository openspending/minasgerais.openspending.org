OpenSpending = "OpenSpending" in window ? OpenSpending : {};

$(function() {
  var context = {
    dataset: "br-mg-ppagloc",
    siteUrl: "http://openspending.org",
    pagesize: 50,
    callback: function(name) {
    }
  };

  OpenSpending.WidgetLink = Backbone.Router.extend({
    routes: {
        "": "home",
        "*args": "drilldown"
    },

    home: function() {
      this.setFilters(this.initialFilters);
    },

    drilldown: function(args) {
      var router = this;
      var currentFilters = this.getFilters();
      router.treetable.drilldown(currentFilters, function (name, filters, drilldown) {
        var filters = _.extend({}, filters);
        filters[drilldown] = name;
        this.setFilters(filters);
      });
    },

    getFragment: function(filters) {
      return _.map(_.keys(filters), function(k) {
        return k + ':' + filters[k];
      }).join('/');
    },

    setFilters: function(filters) {
      var newFilters = $.extend({}, this.getFilters(), filters);
      this.navigate(this.getFragment(newFilters), {trigger: true});
    },

    getFilters: function() {
      var filters = {};
      _.each(Backbone.history.fragment.split('/'), function(kv) {
        var kv_ = kv.split(':', 2);
        filters[kv_[0]] = kv_[1];
      });
      return filters;
    },

    initialize: function(elem, context, filters, drilldowns) {
      this.treetable = OpenSpending.Treetable(elem, context, drilldowns);
      this.initialFilters = filters;
    },
  });

  OpenSpending.app = new OpenSpending.WidgetLink($('#treetable_widget'), context, {'year': '2011'}, ['function', 'subfunction']);
});

