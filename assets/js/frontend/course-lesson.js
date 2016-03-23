;(function ($) {
	$.LP_Course_Item = function () {

	}
	$.LP_Course_Item.Model = Backbone.Model.extend({
		url       : function () {
			return this.rootUrl
		},
		rootUrl   : '',
		initialize: function (data) {
			this.rootUrl = data.rootUrl;
		},
		load      : function (callback) {
			var that = this,
				_completed = function (response, success) {
					var $html = $(response || ''),
						$lesson = $html.find('#learn-press-course-lesson');
					if ($lesson.length == 0) {
						$lesson = $('<div id="learn-press-course-lesson" />');
					}
					if (LearnPress.Hook.applyFilters('learn_press_update_item_content', $lesson, that) !== false) {
						that.set('content', $lesson);
						$(document).trigger('learn_press_course_item_content_replaced', $lesson, that);
						$('.course-item.item-current')
							.removeClass('item-current');
						$('.course-item.course-item-' + that.get('id'))
							.addClass('item-current');
					}
					$.isFunction(callback) && callback.call(that, response);
				};
			$.ajax({
				url     : this.url(),
				dataType: 'html',
				success : function (response) {
					_completed(response, true);
				},
				error   : function () {
					_completed('', false)
				}
			})
		},
		complete  : function (callback) {
			var that = this;
			$.ajax({
				url     : LearnPress_Settings.ajax,
				dataType: 'html',
				data    : {
					action: 'learnpress_complete_lesson',
					id    : this.get('id'),
					nonce : this.get('nonce').complete
				},
				success : function (response) {
					response = LearnPress.parseJSON(response);
					callback && callback.call(that, $.extend(response, {id: that.get('id')}))
				}
			})
		}
	});

	$.LP_Course_Item.View = Backbone.View.extend({
		el            : '#learn-press-course-lesson',
		events        : {
			'click .complete-lesson-button': 'completeLesson'
		},
		initialize    : function () {
			_.bindAll(this, 'updateItem', 'completeLesson');
			this.model.on('change', this.updateItem, this);
			if (LearnPress.Hook.applyFilters('learn_press_before_load_item', this) !== false) {
				if (this.model.get('content')) {
					this.updateItem();
				} else {
					this.model.load();
				}
			}
		},
		updateItem    : function () {
			var $content = this.model.get('content');
			this.$el.replaceWith($content);
			this.setElement($content);
			var url = LearnPress.Hook.applyFilters('learn_press_set_item_url', this.model.get('rootUrl'), this);
			if (url) {
				LearnPress.setUrl(url);
			}
			LearnPress.Hook.doAction('learn_press_item_content_loaded', $content, this);
			//}
		},
		completeLesson: function (e) {
			var that = this;
			this.model.complete(function (response) {
				response = LearnPress.Hook.applyFilters('learn_press_user_complete_lesson_response', response)
				if (response && response.result == 'success') {
					that.$('.complete-lesson-button').replaceWith(response.message);
					$('.course-item-' + response.id).addClass('item-completed');
					if (response.course_result) {
						that.updateProgress(response);
					}
				}
				LearnPress.Hook.doAction('learn_press_user_completed_lesson', response);
				console.log(response)
			});
		},
		updateProgress: function (data) {
			$('.lp-course-progress')
				.attr({
					'data-value': data.course_result
				})
			if (LearnPress.$Course) {
				LearnPress.$Course._sanitizeProgress();
			}
		}
	});
	$.LP_Course_Item.Collection = Backbone.Collection.extend({
		model     : $.LP_Course_Item.Model,
		current   : 0,
		initialize: function () {
			var that = this;
			_.bindAll(this, 'initItems', 'loadItem');
			this.initItems();
		},
		initItems : function () {
			var that = this;
			$('.section-content .course-item').each(function () {
				var $li = $(this),
					$link = $li.find('a'),
					id = parseInt($link.attr('data-id')),
					model = new $.LP_Course_Item.Model({
						id     : id,
						nonce  : {
							complete: $link.attr('data-complete-nonce')
						},
						rootUrl: $link.attr('href'),
						type   : $li.data('type')
					});
				that.add(model);
				if ($li.hasClass('item-current')) {
					that.current = id;
				}
			});

		},
		loadItem  : function (item, link) {
			if ($.isNumeric(item)) {
				item = this.findWhere({id: item});
			} else if ($.type(item) == 'string') {
				item = this.findWhere({rootUrl: item});
			}
			if (LearnPress.Hook.applyFilters('learn_press_load_item_content', true, item, link) !== false) {
				if (item) {
					if (this.view) {
						this.view.undelegateEvents();
						this.view.model.set('content', this.view.$el);
						$('.course-item.item-current')
							.removeClass('item-current');
						$('.course-item.course-item-' + item.get('id'))
							.addClass('item-current');
					}
					if (link) {
						item.set('rootUrl', link);
						item.rootUrl = link;
					}
					this.view = new $.LP_Course_Item.View({model: item});
				}
			}
		}
	});

	$.LP_Course_Item_List_View = Backbone.View.extend({
		model     : $.LP_Course_Item.Collection,
		el        : 'body',
		events    : {
			'click .section-content .course-item': '_loadItem',
			'click .course-item-nav a'           : '_loadItem'
		},
		initialize: function (args) {
			_.bindAll(this, '_loadItem');
			this.model.loadItem(this.model.current);
		},
		_loadItem : function (e) {
			e.preventDefault();
			var $item = $(e.target),
				id = parseInt($item.attr('data-id')),
				link = $item.attr('href');
			this.model.loadItem(id ? id : link, link);
		}
	});

})(jQuery);