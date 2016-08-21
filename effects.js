// Visit 
// http://kilianvalkhof.com/2010/javascript/how-to-build-a-fast-simple-list-filter-with-jquery/
// for more information.

$(document).ready(function() {

    $(".topic").hover(function() {
        $(this).css("background-color", "yellow");
    }, function() {
        $(this).css("background-color", "white");
    });

    // Algorithms
    $("#topic1").click(function() {
        var courseView = document.getElementById("courseView");
        while(courseView.firstChild.nodeType != 1) {
            courseView.removeChild(courseView.firstChild);
        }

        $("#courseView div").each(function() {
            $(this).hide();
        });
        $(".topic").each(function() {
            if ($(this).css("background-color") == "rgb(51, 153, 255)") {
                $(this).css("background-color", "white");
                $(this).hover(function() {
                    $(this).css("background-color", "yellow");
                }, function() {
                    $(this).css("background-color", "white");
                });
            }
        });

        $("#algorithms").show();
        $(this).css("background-color", "#3399FF");
        $(this).off('hover');
    });

    // Artificial Intelligence
    $("#topic2").click(function() {
        var courseView = document.getElementById("courseView");
        while(courseView.firstChild.nodeType != 1) {
            courseView.removeChild(courseView.firstChild);
        }

        $("#courseView div").each(function() {
            $(this).hide();
        });
        $(".topic").each(function() {
            if ($(this).css("background-color") == "rgb(51, 153, 255)") {
                $(this).css("background-color", "white");
                $(this).hover(function() {
                    $(this).css("background-color", "yellow");
                }, function() {
                    $(this).css("background-color", "white");
                });
            }
        });

        $("#ai").show();
        $(this).css("background-color", "#3399FF");
        $(this).off('hover');
    });

    // Bash
    $("#topic3").click(function() {
        var courseView = document.getElementById("courseView");
        while(courseView.firstChild.nodeType != 1) {
            courseView.removeChild(courseView.firstChild);
        }

        $("#courseView div").each(function() {
            $(this).hide();
        });
        $(".topic").each(function() {
            if ($(this).css("background-color") == "rgb(51, 153, 255)") {
                $(this).css("background-color", "white");
                $(this).hover(function() {
                    $(this).css("background-color", "yellow");
                }, function() {
                    $(this).css("background-color", "white");
                });
            }
        });

        $("#bash").show();
        $(this).css("background-color", "#3399FF");
        $(this).off('hover');
    });

    // C++ Programming
    $("#topic4").click(function() {
        var courseView = document.getElementById("courseView");
        while(courseView.firstChild.nodeType != 1) {
            courseView.removeChild(courseView.firstChild);
        }

        $("#courseView div").each(function() {
            $(this).hide();
        });
        $(".topic").each(function() {
            if ($(this).css("background-color") == "rgb(51, 153, 255)") {
                $(this).css("background-color", "white");
                $(this).hover(function() {
                    $(this).css("background-color", "yellow");
                }, function() {
                    $(this).css("background-color", "white");
                });
            }
        });

        $("#cplusplus").show();
        $(this).css("background-color", "#3399FF");
        $(this).off('hover');
    });

    // C Programming
    $("#topic5").click(function() {
        var courseView = document.getElementById("courseView");
        while(courseView.firstChild.nodeType != 1) {
            courseView.removeChild(courseView.firstChild);
        }

        $("#courseView div").each(function() {
            $(this).hide();
        });
        $(".topic").each(function() {
            if ($(this).css("background-color") == "rgb(51, 153, 255)") {
                $(this).css("background-color", "white");
                $(this).hover(function() {
                    $(this).css("background-color", "yellow");
                }, function() {
                    $(this).css("background-color", "white");
                });
            }
        });

        $("#c").show();
        $(this).css("background-color", "#3399FF");
        $(this).off('hover');
    });

    // Computer Architecture
    $("#topic6").click(function() {
        var courseView = document.getElementById("courseView");
        while(courseView.firstChild.nodeType != 1) {
            courseView.removeChild(courseView.firstChild);
        }

        $("#courseView div").each(function() {
            $(this).hide();
        });
        $(".topic").each(function() {
            if ($(this).css("background-color") == "rgb(51, 153, 255)") {
                $(this).css("background-color", "white");
                $(this).hover(function() {
                    $(this).css("background-color", "yellow");
                }, function() {
                    $(this).css("background-color", "white");
                });
            }
        });

        $("#architecture").show();
        $(this).css("background-color", "#3399FF");
        $(this).off('hover');
    });

    // Computer Security
    $("#topic7").click(function() {
        var courseView = document.getElementById("courseView");
        while(courseView.firstChild.nodeType != 1) {
            courseView.removeChild(courseView.firstChild);
        }

        $("#courseView div").each(function() {
            $(this).hide();
        });
        $(".topic").each(function() {
            if ($(this).css("background-color") == "rgb(51, 153, 255)") {
                $(this).css("background-color", "white");
                $(this).hover(function() {
                    $(this).css("background-color", "yellow");
                }, function() {
                    $(this).css("background-color", "white");
                });
            }
        });

        $("#security").show();
        $(this).css("background-color", "#3399FF");
        $(this).off('hover');
    });

    // Data Structures
    $("#topic8").click(function() {
        var courseView = document.getElementById("courseView");
        while(courseView.firstChild.nodeType != 1) {
            courseView.removeChild(courseView.firstChild);
        }

        $("#courseView div").each(function() {
            $(this).hide();
        });
        $(".topic").each(function() {
            if ($(this).css("background-color") == "rgb(51, 153, 255)") {
                $(this).css("background-color", "white");
                $(this).hover(function() {
                    $(this).css("background-color", "yellow");
                }, function() {
                    $(this).css("background-color", "white");
                });
            }
        });

        $("#data-structs").show();
        $(this).css("background-color", "#3399FF");
        $(this).off('hover');
    });

    // Databases
    $("#topic9").click(function() {
        var courseView = document.getElementById("courseView");
        while(courseView.firstChild.nodeType != 1) {
            courseView.removeChild(courseView.firstChild);
        }

        $("#courseView div").each(function() {
            $(this).hide();
        });
        $(".topic").each(function() {
            if ($(this).css("background-color") == "rgb(51, 153, 255)") {
                $(this).css("background-color", "white");
                $(this).hover(function() {
                    $(this).css("background-color", "yellow");
                }, function() {
                    $(this).css("background-color", "white");
                });
            }
        });

        $("#database").show();
        $(this).css("background-color", "#3399FF");
        $(this).off('hover');
    });

    // Digital Systems
    $("#topic10").click(function() {
        var courseView = document.getElementById("courseView");
        while(courseView.firstChild.nodeType != 1) {
            courseView.removeChild(courseView.firstChild);
        }

        $("#courseView div").each(function() {
            $(this).hide();
        });
        $(".topic").each(function() {
            if ($(this).css("background-color") == "rgb(51, 153, 255)") {
                $(this).css("background-color", "white");
                $(this).hover(function() {
                    $(this).css("background-color", "yellow");
                }, function() {
                    $(this).css("background-color", "white");
                });
            }
        });

        $("#digital").show();
        $(this).css("background-color", "#3399FF");
        $(this).off('hover');
    });

    // GIT
    $("#topic11").click(function() {
        var courseView = document.getElementById("courseView");
        while(courseView.firstChild.nodeType != 1) {
            courseView.removeChild(courseView.firstChild);
        }

        $("#courseView div").each(function() {
            $(this).hide();
        });
        $(".topic").each(function() {
            if ($(this).css("background-color") == "rgb(51, 153, 255)") {
                $(this).css("background-color", "white");
                $(this).hover(function() {
                    $(this).css("background-color", "yellow");
                }, function() {
                    $(this).css("background-color", "white");
                });
            }
        });

        $("#git").show();
        $(this).css("background-color", "#3399FF");
        $(this).off('hover');
    });

    // Graph Theory
    $("#topic12").click(function() {
        var courseView = document.getElementById("courseView");
        while(courseView.firstChild.nodeType != 1) {
            courseView.removeChild(courseView.firstChild);
        }

        $("#courseView div").each(function() {
            $(this).hide();
        });
        $(".topic").each(function() {
            if ($(this).css("background-color") == "rgb(51, 153, 255)") {
                $(this).css("background-color", "white");
                $(this).hover(function() {
                    $(this).css("background-color", "yellow");
                }, function() {
                    $(this).css("background-color", "white");
                });
            }
        });

        $("#graphs").show();
        $(this).css("background-color", "#3399FF");
        $(this).off('hover');
    });

    // Graphics
    $("#topic13").click(function() {
        var courseView = document.getElementById("courseView");
        while(courseView.firstChild.nodeType != 1) {
            courseView.removeChild(courseView.firstChild);
        }

        $("#courseView div").each(function() {
            $(this).hide();
        });
        $(".topic").each(function() {
            if ($(this).css("background-color") == "rgb(51, 153, 255)") {
                $(this).css("background-color", "white");
                $(this).hover(function() {
                    $(this).css("background-color", "yellow");
                }, function() {
                    $(this).css("background-color", "white");
                });
            }
        });

        $("#graphics").show();
        $(this).css("background-color", "#3399FF");
        $(this).off('hover');
    });

    // Networks
    $("#topic14").click(function() {
        var courseView = document.getElementById("courseView");
        while(courseView.firstChild.nodeType != 1) {
            courseView.removeChild(courseView.firstChild);
        }

        $("#courseView div").each(function() {
            $(this).hide();
        });
        $(".topic").each(function() {
            if ($(this).css("background-color") == "rgb(51, 153, 255)") {
                $(this).css("background-color", "white");
                $(this).hover(function() {
                    $(this).css("background-color", "yellow");
                }, function() {
                    $(this).css("background-color", "white");
                });
            }
        });

        $("#networks").show();
        $(this).css("background-color", "#3399FF");
        $(this).off('hover');
    });

    // Operating Systems
    $("#topic15").click(function() {
        var courseView = document.getElementById("courseView");
        while(courseView.firstChild.nodeType != 1) {
            courseView.removeChild(courseView.firstChild);
        }

        $("#courseView div").each(function() {
            $(this).hide();
        });
        $(".topic").each(function() {
            if ($(this).css("background-color") == "rgb(51, 153, 255)") {
                $(this).css("background-color", "white");
                $(this).hover(function() {
                    $(this).css("background-color", "yellow");
                }, function() {
                    $(this).css("background-color", "white");
                });
            }
        });

        $("#operating-sys").show();
        $(this).css("background-color", "#3399FF");
        $(this).off('hover');
    });

    // Programming Languages
    $("#topic16").click(function() {
        var courseView = document.getElementById("courseView");
        while(courseView.firstChild.nodeType != 1) {
            courseView.removeChild(courseView.firstChild);
        }

        $("#courseView div").each(function() {
            $(this).hide();
        });
        $(".topic").each(function() {
            if ($(this).css("background-color") == "rgb(51, 153, 255)") {
                $(this).css("background-color", "white");
                $(this).hover(function() {
                    $(this).css("background-color", "yellow");
                }, function() {
                    $(this).css("background-color", "white");
                });
            }
        });

        $("#prog-langs").show();
        $(this).css("background-color", "#3399FF");
        $(this).off('hover');
    });

    // Python
    $("#topic17").click(function() {
        var courseView = document.getElementById("courseView");
        while(courseView.firstChild.nodeType != 1) {
            courseView.removeChild(courseView.firstChild);
        }

        $("#courseView div").each(function() {
            $(this).hide();
        });
        $(".topic").each(function() {
            if ($(this).css("background-color") == "rgb(51, 153, 255)") {
                $(this).css("background-color", "white");
                $(this).hover(function() {
                    $(this).css("background-color", "yellow");
                }, function() {
                    $(this).css("background-color", "white");
                });
            }
        });

        $("#python").show();
        $(this).css("background-color", "#3399FF");
        $(this).off('hover');
    });

    // Software Engineering
    $("#topic18").click(function() {
        var courseView = document.getElementById("courseView");
        while(courseView.firstChild.nodeType != 1) {
            courseView.removeChild(courseView.firstChild);
        }

        $("#courseView div").each(function() {
            $(this).hide();
        });
        $(".topic").each(function() {
            if ($(this).css("background-color") == "rgb(51, 153, 255)") {
                $(this).css("background-color", "white");
                $(this).hover(function() {
                    $(this).css("background-color", "yellow");
                }, function() {
                    $(this).css("background-color", "white");
                });
            }
        });

        $("#software-engineering").show();
        $(this).css("background-color", "#3399FF");
        $(this).off('hover');
    });

    // Unix
    $("#topic19").click(function() {
        var courseView = document.getElementById("courseView");
        while(courseView.firstChild.nodeType != 1) {
            courseView.removeChild(courseView.firstChild);
        }

        $("#courseView div").each(function() {
            $(this).hide();
        });
        $(".topic").each(function() {
            if ($(this).css("background-color") == "rgb(51, 153, 255)") {
                $(this).css("background-color", "white");
                $(this).hover(function() {
                    $(this).css("background-color", "yellow");
                }, function() {
                    $(this).css("background-color", "white");
                });
            }
        });

        $("#unix").show();
        $(this).css("background-color", "#3399FF");
        $(this).off('hover');
    });

    // Web Applications
    $("#topic20").click(function() {
        var courseView = document.getElementById("courseView");
        while(courseView.firstChild.nodeType != 1) {
            courseView.removeChild(courseView.firstChild);
        }

        $("#courseView div").each(function() {
            $(this).hide();
        });
        $(".topic").each(function() {
            if ($(this).css("background-color") == "rgb(51, 153, 255)") {
                $(this).css("background-color", "white");
                $(this).hover(function() {
                    $(this).css("background-color", "yellow");
                }, function() {
                    $(this).css("background-color", "white");
                });
            }
        });

        $("#web").show();
        $(this).css("background-color", "#3399FF");
        $(this).off('hover');
    });
});

jQuery.expr[':'].Contains = function(a,i,m){
    return (a.textContent || a.innerText || "").
        toUpperCase().indexOf(m[3].toUpperCase())>=0;
};

function listFilter(header, topics) {
    var form = document.createElement("form");
    form.setAttribute("class", "filterform");
    form.setAttribute("action", "#");

    var input = document.createElement("input");
    input.setAttribute("class", "filterinput");
    input.setAttribute("placeholder", "Filter");
    input.setAttribute("type", "text");

    $(form).append(input).appendTo(header);

    $(input)
        .change( function () {
            var filter = $(this).val();
            if (filter) {
                $(topics).find("a:not(:Contains(" + filter + "))").
                    parent().slideUp();
                $(topics).find("a:Contains(" + filter + ")").parent().
                    slideDown();
            }
            else {
                $(topics).find("div").slideDown();
            }
            return false;
        })
        .keyup( function () {
            $(this).change();
        });
}

$(function () {
    listFilter($("#header"), $("#topics"));
});
