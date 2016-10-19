;(function( $ ){
    "use strict";
    $( document ).ready( function() {
       $( document ).on( 'click', '.table-orders .cancel-order', function( e ) {
            e.preventDefault();
            var _this = $( this ),
               _href = _this.attr( 'href' );
            jConfirm( learn_press_js_localize.confirm_cancel_order.message, learn_press_js_localize.confirm_cancel_order.title, function (confirm){
                if ( confirm ) {
                    window.location.href = _href;
                }
            } );
           return false;
       } );
    });
})(jQuery);