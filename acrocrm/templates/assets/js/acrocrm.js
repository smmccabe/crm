// --- Acrocrm Leads Module --- //
Drupal.behaviors.acrocrm_leads = {
    'attach': function(context) {
        $(document).ready(function(event) {
            $('[data-tooltip="tooltip"]').tooltip({container: 'body'});

            $(".sales-rep").accordion({
                header: "> h4",
                collapsible: true,
                active: false,
                heightStyle: "content",
                cursor: "move",
                beforeActivate: function(event, ui) {
                    ui.newHeader.addClass("sales-rep-open").removeClass("sales-rep-closed");
                    ui.oldHeader.addClass("sales-rep-closed").removeClass("sales-rep-open");
                }
            }).droppable({
                accept: ".unassigned-lead, .unapproved-lead",
                refreshPositions: true,
                hoverClass: "ui-state-highlight",
                tolerance: "pointer",
                activate: function(event, ui) {
                    $(".ui-accordion-header, .btn").css("cursor", "move");
                    $(".accordion").accordion("option", "cursor", "move");
                    $('[data-tooltip="tooltip"]').tooltip('disable');
                },
                deactivate: function(event, ui) {
                    $(".ui-accordion-header, .btn").css("cursor", "pointer");
                    $(".accordion").accordion("option", "cursor", "pointer");
                    $('[data-tooltip="tooltip"]').tooltip('enable');
                },
                drop: function(event, ui) {
                    var sales_rep = $(this);
                    var lead_draggable = $(ui.draggable);

                    sales_rep.find("> h4").removeClass("sales-rep-hover").bind('mouseenter mouseleave');

                    sales_rep.data("accordion-hovering", "false");
                    if (sales_rep.data("accordion-prev-active") === "false") {
                        sales_rep.accordion("option", "active", false); // Close accordion
                    }

                    var original_rep_id = (lead_draggable.data('assigned-rep-id') != undefined) ? lead_draggable.data('assigned-rep-id') : null;

                    if (original_rep_id != null && original_rep_id == sales_rep.data('rep-id')) {
                        lead_draggable.show();
                        return;
                    }

                    lead_draggable.hide();
                    var url = lead_draggable.data("url") + 'assign_lead/';
                    var params = sales_rep.data('rep-id') + '/' + lead_draggable.data('lead-id');

                    // TODO: Show loading indicator in the sales-rep-lead-list

                    sales_rep.find(".sales-rep-lead-list").load(url + params, function(response, status, xhr) {
                        if (status == "success") {
                            lead_draggable.remove();
                            loadSalesRepInteractions();

                            if (original_rep_id == null) {
                                var leads_list = $('#leads-list');

                                if (leads_list.find("li").length == 0) {
                                    leads_list.html('<div class="lead-list-message-div">No Leads Found</div>');
                                }
                            }
                            else {
                                var original_sales_rep = $('.sales-rep[data-rep-id="' + original_rep_id + '"]');

                                if (original_sales_rep.find("li").length == 0) {
                                    original_sales_rep.find('ul').html('<li class="list-group-item no-assigned-leads">No Assigned Leads</li>');
                                }
                            }

                            // TODO: Update priority counts
                        }
                        else if (status == "error") {
                            event.preventDefault();
                            lead_draggable.show();

                            // TODO: Show error message on top of page like the one when creating a lead
                        }

                        // TODO: Hide the loading indicator in the sales-rep-lead-list
                    });
                },
                over: function(event, ui) {
                    var sales_rep = $(this);
                    sales_rep.find("> h4").addClass("sales-rep-hover").unbind('mouseenter mouseleave');

                    if (sales_rep.accordion("option", "active") === 0) {
                        sales_rep.data("accordion-prev-active", "true"); // Accordion was previously active
                    }
                    else {
                        sales_rep.data("accordion-hovering", "true");

                        setTimeout(function() {
                            if (sales_rep.data("accordion-hovering") === "true") {
                                sales_rep.accordion("option", "active", 0); // Expand accordion
                                sales_rep.data("accordion-prev-active", "false"); // Accordion was not previously active
                                sales_rep.data("accordion-hovering", "false");
                            }
                        }, 750);
                    }
                },
                out: function(event, ui) {
                    var sales_rep = $(this);
                    sales_rep.find("> h4").removeClass("sales-rep-hover").bind('mouseenter mouseleave');

                    sales_rep.data("accordion-hovering", "false");
                    if (sales_rep.data("accordion-prev-active") === "false") {
                        sales_rep.accordion("option", "active", false); // Close accordion
                    }
                }
            });

            $('#leads-list').droppable({
                accept: ".unapproved-lead",
                refreshPositions: true,
                hoverClass: "ui-state-highlight",
                tolerance: "pointer",
                drop: function(event, ui) {
                    var leads_list = $(this);
                    var lead_draggable = $(ui.draggable);

                    lead_draggable.hide();
                    var url = lead_draggable.data("url") + 'unassign_lead/';
                    var params = lead_draggable.data('lead-id');

                    // TODO: Show loading indicator for the leads-list

                    leads_list.load(url + params, function(response, status, xhr) {
                        if (status == "success") {
                            lead_draggable.remove();
                            loadLeadList(event); // TODO: Check for success or fail

                            var original_rep_id = (lead_draggable.data('assigned-rep-id') != undefined) ? lead_draggable.data('assigned-rep-id') : null;
                            var original_sales_rep = $('.sales-rep[data-rep-id="' + original_rep_id + '"]');

                            if (original_sales_rep.find("li").length == 0) {
                                original_sales_rep.find('ul').html('<li class="list-group-item no-assigned-leads">No Assigned Leads</li>');
                            }

                            // TODO: Update priority counts for the sales rep it was taken from
                        }
                        else if (status == "error") {
                            event.preventDefault();
                            lead_draggable.show();

                            // TODO: Show error message on top of page like the one when creating a lead
                        }

                        // TODO: Hide loading indicator for the leads-list
                    });
                }
            });

            loadLeadList(event);
            loadSalesRepInteractions();
        });

        function loadSalesRepInteractions() {
            $('.readmore').readmore({
                collapsedHeight: 18
            });

            // TODO: Need to fix the issue when the edit or delete lead button is pressed where the click event also triggers the accordion
            // TODO: The accordion slightly jumps on close. This is caused by a margin or something and can be fixed.
            $(".sales-rep-lead").accordion({
                header: "> h5",
                collapsible: true,
                active: false,
                heightStyle: "content",
                cursor: "move",
                activate: function(event, ui) {
                    $('.readmore').readmore({
                        collapsedHeight: 18
                    });
                }
            });

            // Unapproved leads are the leads that have been approved but are not sent to hubspot, etc.
            $(".unapproved-lead").draggable({
                appendTo: "body",
                containment: "document",
                zIndex: 100,
                helper: "clone",
                revert: "invalid",
                cursor: "move",
                cursorAt: { top: 0, left: 0 },
                refreshPositions: true,
                start: function(event, ui) {
                    $(this).hide();

                    // TODO: Properly format the clone being dragged
                    var lead_clone = $(ui.helper);
                    //lead_clone.data("rep-id", $(this).parent('id'));
                    lead_clone.find(".pull-right").hide();
                    lead_clone.addClass("dragging-lead");
                    lead_clone.find("select").replaceWith($(ui.helper).find("option:selected").text());
                },
                stop: function(event, ui) {
                    $(this).show();
                }
            });
        }

        function loadLeadsListInteractions() {
            $(".unassigned-lead").draggable({
                appendTo: "body",
                containment: "document",
                zIndex: 100,
                helper: "clone",
                revert: "invalid",
                cursor: "move",
                cursorAt: { top: 0, left: 0 },
                refreshPositions: true,
                start: function(event, ui) {
                    $(this).hide();

                    var lead_clone = $(ui.helper);
                    lead_clone.find(".pull-right").hide();
                    lead_clone.addClass("dragging-lead");
                    lead_clone.find("select").replaceWith($(ui.helper).find("option:selected").text());
                },
                stop: function(event, ui) {
                    $(this).show();
                }
            });
        }

        function updatePriorityText(rep_id, priority) {
            if (priority === '') {
                var text = $('#unassigned-' + rep_id).text();
                text = text.split(' ');
                var new_priority = parseInt(text[1]) + 1;
                $('#unassigned-' + rep_id).text("Unassigned: " + new_priority);
            }

            else if (priority === 'low') {
                var text = $('#low-' + rep_id).text();
                text = text.split(' ');
                var new_priority = parseInt(text[1]) + 1;
                $('#low-' + rep_id).text("Low: " + new_priority);
            }

            else if (priority === 'medium') {
                var text = $('#med-' + rep_id).text();
                text = text.split(' ');
                var new_priority = parseInt(text[1]) + 1;
                $('#med-' + rep_id).text("Medium: " + new_priority);
            }

            else if (priority === 'high') {
                var text = $('#high-' + rep_id).text();
                text = text.split(' ');
                var new_priority = parseInt(text[1]) + 1;
                $('#high-' + rep_id).text("High: " + new_priority);
            }
        }

        $('#lead-edit-modal').on('show.bs.modal', function (event) {
            var button = $(event.relatedTarget);
            var url = button.data('url');

            var modal = $(this);
            modal.find('.modal-content').load(url);
        });

        $('#delete-lead-confirmation-modal').on('show.bs.modal', function (event) {
            var trigger_button = $(event.relatedTarget);
            var url = trigger_button.data('url');

            var modal = $(this);

            // Keep these comments for now

            //modal.find('#deleteLeadConfirmationButton').click(function() {
            //    $.ajax({
            //        url: url + id,
            //    })
            //    .done(function() {
            //        //modal.modal('hide');
            //        //window.location.assign('overview');
            //    })
            //    .fail(function() {
            //        alert('error');
            //    });
            //});

            modal.find('#delete-lead-confirmation-button').click(function() {
                window.location.replace(url);
            });
        });

        function loadLeadList(event) {
            var target = $(event.currentTarget);
            var lead_search = $('#lead-search');
            var url = lead_search.data('url');
            var group = target.data('group');
            var lead_search_box = lead_search.find('input');
            var value = '';
            var params = '';

            if (group != null) {
                value = target.data('value');
                params += group + '/' + value;
            }
            else {
                var search_term = lead_search_box.val();
                params += 'search';

                if (search_term != '') {
                    params += '/' + $.trim(search_term).replace(/ /g,"+");
                }
            }

            var lead_list = $('#leads-list');
            lead_search.find('img').show();
            lead_search.find('.glyphicon-search').hide();

            lead_list.load(url + params, function(response, status, xhr) {
                if (status == "success") {
                    loadLeadsListInteractions()

                    if (group != null) {
                        if (group != 'sort-order') {
                            $("ul li a[data-group=" + group + "] .lead-search-dropdown-check").remove();
                            $("ul li a[data-group=" + group + "][data-value=" + value + "]").prepend("<i class='lead-search-dropdown-check glyphicon glyphicon-ok'></i>");
                        }
                        else {
                            if (value == 'asc') {
                                $("[data-group='sort-order'][data-value=desc]").removeClass("active");
                                $("[data-group='sort-order'][data-value=asc]").addClass("active");
                            }
                            else {
                                $("[data-group='sort-order'][data-value=asc]").removeClass("active");
                                $("[data-group='sort-order'][data-value=desc]").addClass("active");
                            }
                        }

                        if (group == 'search-field') {
                            lead_search_box.attr('placeholder', "Search by " + value);
                        }
                    }

                    $(this).find('[data-tooltip="tooltip"]').tooltip({container: 'body'});
                }
                else if (status == "error") {
                    $('#leads-list').html("<div class='lead-list-message-div'>Sorry but there was an error: " + xhr.status + " " + xhr.statusText + "</div>");
                }

                lead_search.find('img').hide();
                lead_search.find('.glyphicon-search').show();
            });
        }

        var timeout_thread = null;
        var previous_val = '';
        $('#lead-search input').on('keyup', function(event) {
            if (event.keyCode == '13') {
                loadLeadList(event);
                return;
            }

            if ($.trim($(this).val()) == '' && $.trim(previous_val) == '') {
                previous_val = $(this).val();
                return;
            }
            previous_val = $(this).val();

            clearTimeout(timeout_thread);
            timeout_thread = setTimeout(function() { loadLeadList(event); }, 100);
        });

        $('.lead-filter, #lead-search-button').on('click', function(event) {
            loadLeadList(event);
            event.stopPropagation();
        });

        function createHubspotContact(lead_id, element) {
            var imgTag = '<img id="loading-gif-' + lead_id + '" alt="loading" src="/acrocrm/templates/assets/images/ajax-loader.gif">';
            $(imgTag).insertBefore($("#" + lead_id).parent());
            $("#" + lead_id).hide();
            $.ajax({
                url: "/acrocrm_hubspot_integration/create_contact/" + lead_id,
                success: function (data) {
                    $("#loading-gif-" + lead_id).remove();
                    $("#" + lead_id).show();
                    var message = data.trim();
                    $('#message-container').remove();
                    if (message == "success") {
                        var prefix = '<div id="message-container" class="row"><div class="col-lg-10 col-md-12"><div class="alert alert-success">';
                        var suffix = '<br></div></div></div>';
                        $(prefix + 'The HubSpot contact was created successfully' + suffix).insertAfter('#header-row');
                        $('#lead_' + lead_id + '_container').remove();

                        if ($('.lead-container').length == 0) {
                            $('<div class="no-leads">There are no leads to display.</div>').insertAfter('#delete-lead-confirmation-modal');
                        }
                    } else {
                        var prefix = '<div id="message-container" class="row"><div class="col-lg-10 col-md-12"><div class="alert alert-danger">';
                        var suffix = '<br></div></div></div>';

                        if (message == "contact_already_exists") {
                            $(prefix + "The contact you are trying to create on HubSpot already exists. " +
                                "This could be due to a duplicate email address." + suffix).insertAfter('#header-row');
                        } else if (message == "email_invalid") {
                            $(prefix + "The email address of the contact you are trying to create on HubSpot is invalid. " +
                                "HubSpot has stricter email validation than AcroCRM." + suffix).insertAfter('#header-row');
                        } else if (message == "email_invalid") {
                            $(prefix + "The the contact you are trying to create could not be found. " +
                                "Refresh the page and try again" + suffix).insertAfter('#header-row');
                        } else {
                            $(prefix + message + suffix).insertAfter('#header-row');
                        }
                    }
                },
                dataType: 'text'
            });
        }
    }
};