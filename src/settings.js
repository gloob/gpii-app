"use strict";
(function () {
    var fluid = window.fluid,
        gpii = fluid.registerNamespace("gpii"),
        ipcRenderer = require("electron").ipcRenderer;

    fluid.registerNamespace("gpii.pcp");

    /**
     * Registers callbacks to be invoked whenever the main electron
     * process sends a corresponding message.
     * @param that {Component} An instance of mainWindow.
     */
    gpii.pcp.addCommunicationChannel = function (that) {
        ipcRenderer.on("keyIn", function (event, preferences) {
            that.updatePreferences(preferences);
        });

        ipcRenderer.on("updateSetting", function (event, settingData) {
            that.events.onSettingUpdate.fire(settingData);
        });

        ipcRenderer.on("keyOut", function (event, preferences) {
            that.updatePreferences(preferences);
            that.events.onKeyOut.fire();
        });
    };

    /**
     * A function which should be called whenever a settings is updated
     * as a result of a user's input. Its purpose is to notify the main
     * electron process for the change.
     * @param path {String} The path of the updated setting.
     * @param value {Any} The new, updated value for the setting. Can be
     * of different type depending on the setting.
     */
    gpii.pcp.updateSetting = function (path, value) {
        ipcRenderer.send("updateSetting", {
            path: path,
            value: value
        });
    };

    gpii.pcp.updateActivePreferenceSet = function (value) {
        ipcRenderer.send("updateActivePreferenceSet", {
            value: value
        });
    };

    /**
     * A function which should be called when the PCP window needs to be
     * closed. It simply notifies the main electron process for this.
     */
    gpii.pcp.closeSettingsWindow = function () {
        ipcRenderer.send("closePCP");
    };

    /**
     * Utility function for retrieving the last sub-element of a container
     * @param container {Object} The jQuery container object
     * @returns {Object} A jQuery container object
     */
    gpii.pcp.getContainerLastChild = function (container) {
        return container.children().last();
    };


    /**
     * Represents an "exemplar" (configuration) for a component.
     * A good place to keep a *related template resource* path.
     */
    fluid.defaults("gpii.pcp.exemplar", {
        gradeNames: "fluid.component",
        mergePolicy: {
            widgetOptions: "noexpand"
        },
        template: null,
        grade: null,
        schemeType: null,
        widgetOptions: {
            // proper model bindings and options
            model: null,
            attrs: {}
        }
    });

    fluid.defaults("gpii.pcp.exemplar.settingsVisualizer", {
        gradeNames: "gpii.pcp.exemplar",

        template: "settingRow.html",
        grade: "gpii.pcp.settingsVisualizer"
    });

    fluid.defaults("gpii.pcp.exemplar.multipicker", {
        gradeNames: "gpii.pcp.exemplar",
        template: "multipicker.html",
        grade: "gpii.pcp.widgets.multipicker",
        schemeType: "array",
        widgetOptions: {
            model: {
                values: "{settingPresenter}.model.values",
                names: "{settingPresenter}.model.values",
                value: "{settingPresenter}.model.value"
            },
            attrs: {
                name: "{settingPresenter}.model.path"
            }
        }
    });

    fluid.defaults("gpii.pcp.exemplar.switch", {
        gradeNames: "gpii.pcp.exemplar",
        template: "switch.html",
        grade: "gpii.pcp.widgets.switch",
        schemeType: "boolean",
        widgetOptions: {
            model: {
                enabled: "{settingPresenter}.model.value"
            },
            attrs: {
                name: "{settingPresenter}.model.path"
            }
        }
    });

    fluid.defaults("gpii.pcp.exemplar.dropdown", {
        gradeNames: "gpii.pcp.exemplar",
        template: "dropdown.html",
        grade: "gpii.pcp.widgets.dropdown",
        schemeType: "string",
        widgetOptions: {
            model: {
                optionNames: "{settingPresenter}.model.values",
                optionList: "{settingPresenter}.model.values",
                selection: "{settingPresenter}.model.value"
            }
        }
    });

    fluid.defaults("gpii.pcp.exemplar.stepper", {
        gradeNames: "gpii.pcp.exemplar",
        template: "stepper.html",
        grade: "gpii.pcp.widgets.stepper",
        schemeType: "number",
        widgetOptions: {
            model: {
                value: "{settingPresenter}.model.value",
                step: "{settingPresenter}.model.divisibleBy",
                range: {
                    min: "{settingPresenter}.model.min",
                    max: "{settingPresenter}.model.max"
                }
            }
        }
    });

    fluid.defaults("gpii.pcp.exemplar.textfield", {
        gradeNames: "gpii.pcp.exemplar",
        template: "textfield.html",
        grade: "gpii.pcp.widgets.textfield",
        schemeType: "text",
        widgetOptions: {
            model: {
                value: "{settingPresenter}.model.value"
            }
        }
    });

    fluid.registerNamespace("gpii.pcp.widgetExemplars");

    gpii.pcp.widgetExemplars.getExemplarBySchemeType = function (widgetExemplars, schemeType) {
        return fluid.values(widgetExemplars)
            .filter(fluid.isComponent)
            .find(function matchType(exemplar) { return exemplar.options.schemeType === schemeType; });
    };

    /**
     * A listener which is invoked whenever a setting row is destroyed. This function
     * simply removes the container of the destroyed dynamic component from the DOM.
     * @param mainWindowContainer {Object} A jQuery object representing the container
     * of the settings window
     * @param settingRowContainer {String} A unique selector identifying the container
     * of the setting row that has been removed.
     */
    gpii.pcp.onSettingRowDestroy = function (mainWindowContainer, settingRowContainer) {
        if (settingRowContainer) {
            mainWindowContainer.find(settingRowContainer).remove();
        }
    };

    /**
     * A listener which is called when a setting has its value changed from the outside,
     * i.e. not by the user's input in the PCP.
     * @param that {Component} An instance of singleSettingPresenter.
     * @param path {String} The path indentifying the current setting.
     * @param settingData {Object} An object describing what has been changed. It contains
     * the path of the changed setting, as well as its new value.
     */
    gpii.pcp.onSettingUpdate = function (that, path, settingData) {
        if (path === settingData.path) {
            that.applier.change("value", settingData.value, null, "outer");
        }
    };

    /**
     * A method responsible for showing a restart icon when the user changes a setting
     * which is not dynamic.
     * @param dynamic {Boolean} Whether the current setting is dynamic or not.
     * @param restartIcon {Object} A jQuery object representing the restart icon.
     */
    gpii.pcp.showRestartIcon = function (dynamic, restartIcon) {
        if (!dynamic) {
            restartIcon.show();
        }
    };

    /**
     * A method responsible for showing a memory icon if the setting will be persisted
     * after a user has changed it.
     * @param isPersisted {Boolean} Whether the current setting will be persisted or not.
     * @param memoryIcon {Object} A jQuery object representing the memory icon.
     */
    gpii.pcp.showMemoryIcon = function (isPersisted, memoryIcon) {
        if (isPersisted) {
            memoryIcon.show();
        }
    };

    /**
     * Represents an container for all exemplars for widgets
     * N.B. Sub components should be used as immutable objects!
     */
    fluid.defaults("gpii.pcp.widgetExemplars", {
        gradeNames: "fluid.component",
        components: {
            multipicker: {
                type: "gpii.pcp.exemplar.multipicker"
            },
            switch: {
                type: "gpii.pcp.exemplar.switch"
            },
            dropdown: {
                type: "gpii.pcp.exemplar.dropdown"
            },
            stepper: {
                type: "gpii.pcp.exemplar.stepper"
            },
            textfield: {
                type: "gpii.pcp.exemplar.textfield"
            }
        },
        invokers: {
            getExemplarBySchemeType: {
                funcName: "gpii.pcp.widgetExemplars.getExemplarBySchemeType",
                args: ["{that}", "{arguments}.0"]
            }
        }
    });


    /**
     * Creates the binding with the already rendered DOM elements.
     * Expects: widget configuration and model
     */
    fluid.defaults("gpii.pcp.settingPresenter", {
        gradeNames: "fluid.viewComponent",
        selectors: {
            icon: ".flc-icon",
            solutionName: ".flc-solutionName",
            title: ".flc-title",
            memoryIcon: ".flc-memoryIcon",
            restartIcon: ".flc-restartIcon",
            widget: ".flc-widget"
        },
        model: {
            icon: null,
            solutionName: null,
            title: null,
            values: null,
            value: null
        },
        widgetConfig: {
            widgetOptions: null,
            grade: null
        },

        components: {
            widget: {
                type: "{that}.options.widgetConfig.options.grade",
                container: "{that}.dom.widget",
                options: "{settingPresenter}.options.widgetConfig.options.widgetOptions"
            }
        },
        modelListeners: {
            value: {
                funcName: "gpii.pcp.showRestartIcon",
                args: ["{that}.model.dynamic", "{that}.dom.restartIcon"],
                excludeSource: "init"
            }
        },
        listeners: {
            "{mainWindow}.events.onSettingUpdate": {
                funcName: "gpii.pcp.onSettingUpdate",
                args: ["{that}", "{that}.model.path", "{arguments}.0"]
            },
            "onCreate.setIcon": {
                this: "{that}.dom.icon",
                method: "attr",
                args: ["src", "{that}.model.icon"]
            },
            "onCreate.setSolutionName": {
                this: "{that}.dom.solutionName",
                method: "text",
                args: "{that}.model.solutionName"
            },
            "onCreate.setTitle": {
                this: "{that}.dom.title",
                method: "append",
                args: "{that}.model.title"
            },
            "onCreate.setMemoryIcon": {
                funcName: "gpii.pcp.showMemoryIcon",
                args: ["{that}.model.isPersisted", "{that}.dom.memoryIcon"]
            }
        }
    });

    /**
     * Renders all related markup for a setting:
     * - container;
     * - setting markup;
     * - widget markup
     * Expects: markup
     * Saves the newly created setting outer container internally
     */
    fluid.defaults("gpii.pcp.settingRenderer", {
        gradeNames: "fluid.viewComponent",

        markup: {
            container: null,
            setting: null,
            widget: null
        },

        model: {
            // Save the container created
            settingContainer: null
        },
        events: {
            onSettingContainerRendered: null,
            onSettingMarkupRendered: null,
            onWidgetMarkupRendered: null
        },
        components: {
            /*
             * Render the outer most container for the setting
             */
            renderSettingContainer: {
                type: "fluid.viewComponent",
                container: "{that}.container",
                options: {
                    // TODO extract as component -> container renderer?
                    listeners: {
                        "onCreate.render": {
                            this: "{that}.container",
                            method: "append",
                            args: ["{settingRenderer}.options.markup.container"]
                        },
                        "onCreate.updateContainer": {
                            funcName: "{settingRenderer}.setContainer",
                            args: "@expand:gpii.pcp.getContainerLastChild({that}.container)",
                            priority: "after:render"
                        },
                        "onCreate.notify": {
                            funcName: "{settingRenderer}.events.onSettingContainerRendered.fire",
                            // Get the newly created container
                            priority: "after:updateContainer"
                        }
                    }
                }
            },
            /**
             * Renders the setting markup inside the dedicated container
             */
            renderSettingMarkup: {
                type: "fluid.viewComponent",
                container: "{that}.model.settingContainer",
                createOnEvent: "onSettingContainerRendered",
                options: {
                    widgetContainerClass: ".flc-widget",
                    listeners: {
                        "onCreate.render": {
                            this: "{that}.container",
                            method: "append",
                            args: "{settingRenderer}.options.markup.setting"
                        },
                        "onCreate.notify": {
                            funcName: "{settingRenderer}.events.onSettingMarkupRendered.fire",
                            /*
                             * Get the widget container.
                             * Should match single element (jquery returns an array of matches)
                             */
                            args: "@expand:$({that}.options.widgetContainerClass, {that}.container)",
                            priority: "after:render"
                        }
                    }
                }
            },
            /*
             * Render widget related markup
             */
            renderWidgetMarkup: {
                type: "fluid.viewComponent",
                // the widget container
                container: "{arguments}.0",
                createOnEvent: "onSettingMarkupRendered",
                options: {
                    listeners: {
                        "onCreate.render": {
                            this: "{that}.container",
                            method: "append",
                            args: "{settingRenderer}.options.markup.widget"
                        },
                        "onCreate.notify": {
                            funcName: "{settingRenderer}.events.onWidgetMarkupRendered.fire",
                            priority: "after:render"
                        }
                    }
                }
            }
        },
        invokers: {
            setContainer: {
                changePath: "settingContainer",
                value: "{arguments}.0"
            }
        }
    });

    /**
     * Handles visualization of single setting.
     * Expects: markup for the all containers and the widget; widgetConfig needed for the setting; the setting
     */
    fluid.defaults("gpii.pcp.settingVisualizer",  {
        gradeNames: "fluid.viewComponent",

        setting: null,
        widgetConfig: null,
        markup: {
            container: null,
            setting: null,
            widget: null
        },

        events: {
            // XXX not quite valid naming as the widget component (in settingPresenter) also renders
            onSettingRendered: null
        },

        listeners: {
            "{mainWindow}.events.onKeyOut": {
                "this": "{that}",
                method: "destroy"
            },
            "onDestroy": {
                funcName: "gpii.pcp.onSettingRowDestroy",
                args: ["{mainWindow}.container", "{that}.settingRenderer.model.settingContainer"]
            }
        },

        components: {
            settingRenderer: {
                type: "gpii.pcp.settingRenderer",
                container: "{that}.container",

                options: {
                    markup: "{settingVisualizer}.options.markup",
                    listeners: {
                        "onWidgetMarkupRendered.notify": {
                            funcName: "{settingVisualizer}.events.onSettingRendered.fire",
                            // pass the created by the subcomponent container
                            args: "{that}.model.settingContainer"
                        }
                    }
                }
            },
            settingPresenter: {
                type: "gpii.pcp.settingPresenter",
                createOnEvent: "onSettingRendered",
                container: "{arguments}.0",
                options: {
                    widgetConfig: "{settingVisualizer}.options.widgetConfig",
                    model: "{settingVisualizer}.options.setting",
                    modelListeners: {
                        value: {
                            funcName: "gpii.pcp.updateSetting",
                            args: ["{that}.model.path", "{change}.value"],
                            excludeSource: ["init", "outer"]
                        }
                    }
                }
            }
        }
    });


    fluid.registerNamespace("gpii.pcp.settingsVisualizer");


    /**
     * Constructs the markup for the indexed container - sets proper index.
     *
     * @param markup {Object}
     * @param markup.containerClassPrefix {String} The class prefix for the indexed container.
     *   Should have a `id` interpolated expression.
     * @param markup.container {String} The markup which is to be interpolated with the container index.
     *   Should have a `containerClass` interpolated expression.
     * @param containerIndex {Number} The index for the container
     * @returns {String}
     */
    gpii.pcp.settingsVisualizer.getIndexedContainerMarkup = function (markup, containerIndex) {
        // Remove the "." prefix
        var containerClass = fluid.stringTemplate(markup.containerClassPrefix, { id: containerIndex });
        return fluid.stringTemplate(markup.container, { containerClass: containerClass });
    };

    /**
     * Simple getter for the property that supports complex keys containing '.' (dots).
     */
    gpii.pcp.getProperty = function (obj, property) {
        return obj && obj[property];
    };


    gpii.pcp.settingsVisualizer.updateSettingsPresentations = function (that, settings) {
        // TODO improve
        settings.forEach(function (setting, settingIndex) {
            that.events.onSettingCreated.fire(settingIndex, setting);
        });
    };

    /*
     * With markup given, visualizes the list of settings passed - rendering and binding of each.
     * Expects:
     *   - settings list;
     *   - widgetExemplars containing widget related options;
     *   - markup
     */
    fluid.defaults("gpii.pcp.settingsVisualizer", {
        gradeNames: "fluid.viewComponent",

        model: {
            settings: null
        },
        widgetExemplars: [],
        markup: {
            setting: null
            // per widget exemplar property
        },
        dynamicContainerMarkup: {
            container: "<div class=\"%containerClass\"></div>",
            containerClassPrefix: "flc-settingListRow-%id"
        },
        events: {
            onSettingCreated: null
        },
        modelListeners: {
            settings: {
                func: "{that}.updateSettingsPresentations",
                args: ["{that}", "{that}.model.settings"]
            }
        },
        invokers: {
            updateSettingsPresentations: {
                funcName: "gpii.pcp.settingsVisualizer.updateSettingsPresentations"
            }
        },
        dynamicComponents: {
            settingVisualizer: {
                type: "gpii.pcp.settingVisualizer",
                container: "{that}.container",
                createOnEvent: "onSettingCreated",
                options: {
                    settingIndex: "{arguments}.0",
                    setting: "{arguments}.1",

                    widgetConfig: "@expand:{settingsVisualizer}.options.widgetExemplars.getExemplarBySchemeType({that}.options.setting.type)",
                    markup: {
                        container: "@expand:gpii.pcp.settingsVisualizer.getIndexedContainerMarkup({settingsVisualizer}.options.dynamicContainerMarkup, {that}.options.settingIndex)",
                        setting: "{settingsVisualizer}.options.markup.setting", // markup.setting",
                        widget: "@expand:gpii.pcp.getProperty({settingsVisualizer}.options.markup, {that}.options.widgetConfig.options.grade)"
                    }
                }
            }
        }
    });


    fluid.registerNamespace("gpii.pcp.settingsPanel");

    gpii.pcp.settingsPanel.getExemplarsList = function (exemplars) {
        return fluid.values(exemplars)
            .filter(fluid.isComponent);
    };

    /**
     * Simplifies the `fluid.resourcesLoader`'s resource object, to supply only the fetched data.
     *
     * @param resources {Object} The `fluid.resourceLoader`'s `resource` object after fetch.
     * @returns {Object} Object with properties like: `{resourceKey}: {resourceText}`
     */
    gpii.pcp.settingsPanel.flattenResources = function (resources) {
        return fluid.keys(resources)
            .reduce(function (markupMap, resourceKey) {
                markupMap[resourceKey] = resources[resourceKey].resourceText;
                return markupMap;
            }, {});
    };

    /**
     * Resources that are to be fetched - settings inner container and widgets'.
     *
     * @param settingExemplar {Object} A 'gpii.pcp.exemplar.settingsVisualizer' object.
     *   Note: it has a fixed key.
     * @param widgetExemplarsList {Object[]} The list of `gpii.pcp.exemplar`-s
     */
    gpii.pcp.settingsPanel.getResourcesToFetch = function (settingExemplar, widgetExemplarsList) {
        function getWidgetResources(exemplars) {
            return exemplars.reduce(function (markup, exemplar) {
                markup[exemplar.options.grade] = exemplar.options.template;
                return markup;
            }, {});
        }

        var settingsVisualizerMarkup = {
            setting:  settingExemplar.options.template
        };
        var widgetsMarkup = getWidgetResources(widgetExemplarsList);

        return Object.assign(settingsVisualizerMarkup, widgetsMarkup);
    };

    /**
     * The top most component for representation of list of settings.
     * Responsible for fetching all related templates, and visualization of settings
     * Expects: list of settings
     */
    fluid.defaults("gpii.pcp.settingsPanel", {
        gradeNames: "fluid.viewComponent",
        model: {
            settings: []
        },

        components: {
            settingsExemplars: {
                type: "fluid.component",
                options: {
                    members: {
                        widgetExemplarsList: "@expand:gpii.pcp.settingsPanel.getExemplarsList({that}.widgetExemplars)"
                    },
                    components: {
                        widgetExemplars: {
                            type: "gpii.pcp.widgetExemplars"
                        },
                        settingsVisualizerExemplar: {
                            type: "gpii.pcp.exemplar.settingsVisualizer"
                        }
                    }
                }
            },
            resourcesLoader: {
                type: "fluid.resourceLoader",
                options: {
                    resources: "@expand:gpii.pcp.settingsPanel.getResourcesToFetch({settingsExemplars}.settingsVisualizerExemplar, {settingsExemplars}.widgetExemplarsList)",
                    listeners: {
                        onResourcesLoaded: "{settingsPanel}.events.onTemplatesLoaded"
                    }
                }
            },
            // Represents the list of the settings component
            settingsVisualizer: {
                type: "gpii.pcp.settingsVisualizer",
                createOnEvent: "onTemplatesLoaded",
                container: "{that}.container",
                options: {
                    widgetExemplars: "{settingsExemplars}.widgetExemplars",
                    markup: "@expand:gpii.pcp.settingsPanel.flattenResources({resourcesLoader}.resources)",
                    model: {
                        settings: "{settingsPanel}.model.settings"
                    }
                }
            }
        },
        events: {
            onTemplatesLoaded: null
        }
    });

    /**
     * A function which checks if an array object holds more than one element.
     * @param arr {Array} The array to be checked.
     * @return {Boolean} Whether the array has more than one element.
     */
    gpii.pcp.hasMultipleItems = function (arr) {
        return arr && arr.length > 1;
    };

    /**
     * Retrieves the type for the preferenceSetPicker subcomponent. In case there
     * is more than one available preference set, the type should be a dropdown.
     * Otherwise, the component should not initialize and ignore all its config
     * properties (and hence must have an emptySubcomponent type).
     * @param preferenceSets {Array} An array of the current preference sets.
     * @return {String} The type of the preferenceSetPicker subcomponent.
     */
    gpii.pcp.getPreferenceSetPickerType = function (preferenceSets) {
        return gpii.pcp.hasMultipleItems(preferenceSets) ? "gpii.pcp.widgets.dropdown" : "fluid.emptySubcomponent";
    };

    /**
     * Updates the DOM elements corresponding to the header component whenever new
     * preferences are received.
     * @param preferenceSets {Array} An array containing the new preferece sets.
     * @param preferenceSetPickerElem {Object} A jQuery object corresponding to the
     * preference set dropdown (in case there are multiple preference sets, it should
     * be shown, otherwise it should be hidden).
     * @param activePreferenceSetElem {Object} A jQuery object corresponding to the
     * preference set label (in case there is a single preference set it should be
     * show, otherwise it should be hidden).
     */
    gpii.pcp.updateHeader = function (preferenceSets, preferenceSetPickerElem, activePreferenceSetElem) {
        if (gpii.pcp.hasMultipleItems(preferenceSets)) {
            preferenceSetPickerElem.show();
            activePreferenceSetElem.hide();
        } else {
            preferenceSetPickerElem.hide();
            activePreferenceSetElem.show();
        }
    };

    /**
     * A listener which is invoked whenever the preference set picker component is
     * destroyed. This function simply removes all options for the dropdown (actually
     * represented as a <select> element) from the DOM.
     * @param container {Object} A jQuery object representing the parent container
     * of the preference set picker.
     */
    gpii.pcp.onPreferenceSetPickerDestroy = function (container) {
        container.find("option").remove();
    };

    /**
     * Updates the passed DOM element to contain the name of the active preference
     * set. If there is no currently active preference set (e.g. if there is no
     * keyed-in user), nothing should be displayed.
     * @param activeSetElement {Object} A jQuery object representing the DOM element
     * whose text is to be updated.
     * @param preferences {Object} An object containing all preference set, as well
     * as information about the currently active preference set.
     */
    gpii.pcp.updateActiveSetElement = function (activeSetElement, preferences) {
        var activePreferenceSet = fluid.find_if(preferences.sets,
            function (preferenceSet) {
                return preferenceSet.path === preferences.activeSet;
            }
        );

        if (activePreferenceSet) {
            activeSetElement.text(activePreferenceSet.name);
        } else {
            activeSetElement.empty();
        }
    };

    /**
     * TODO
     */
    fluid.defaults("gpii.pcp.header", {
        gradeNames: ["fluid.viewComponent"],
        selectors: {
            preferenceSetPicker: ".flc-prefSetPicker",
            activePreferenceSet: ".flc-activePreferenceSet",
            closeBtn: ".flc-closeBtn"
        },
        model: {
            preferences: {
                sets: "{mainWindow}.model.preferences.sets",
                activeSet: "{mainWindow}.model.preferences.activeSet"
            }
        },
        modelListeners: {
            "preferences.activeSet": [{
                funcName: "gpii.pcp.updateActivePreferenceSet",
                args: ["{change}.value"],
                excludeSource: ["init", "outer"],
                namespace: "notifyMainProcess"
            },{
                funcName: "gpii.pcp.updateActiveSetElement",
                args: ["{that}.dom.activePreferenceSet", "{that}.model.preferences"],
                namespace: "updateElement"
            }]
        },
        components: {
            preferenceSetPicker: {
                type: "@expand:gpii.pcp.getPreferenceSetPickerType({that}.model.preferences.sets)",
                container: "{that}.dom.preferenceSetPicker",
                createOnEvent: "{mainWindow}.events.onPreferencesUpdated",
                options: {
                    model: {
                        optionNames: {
                            expander: {
                                func: "fluid.getMembers",
                                args: ["{header}.model.preferences.sets", "name"]
                            }
                        },
                        optionList: {
                            expander: {
                                func: "fluid.getMembers",
                                args: ["{header}.model.preferences.sets", "path"]
                            }
                        },
                        selection: "{header}.model.preferences.activeSet"
                    },
                    listeners: {
                        "onDestroy.removeOptions": {
                            funcName: "gpii.pcp.onPreferenceSetPickerDestroy",
                            args: ["{that}.container"]
                        }
                    }
                }
            }
        },
        listeners: {
            "onCreate.initCloseBtn": {
                "this": "{that}.dom.closeBtn",
                method: "on",
                args: ["click", "{mainWindow}.close"]
            },
            "{mainWindow}.events.onPreferencesUpdated": {
                funcName: "gpii.pcp.updateHeader",
                args: ["{that}.model.preferences.sets", "{that}.dom.preferenceSetPicker", "{that}.dom.activePreferenceSet"]
            }
        }
    });

    fluid.defaults("gpii.pcp.splash", {
        gradeNames: "fluid.viewComponent",
        selectors: {
            splash: ".flc-splash"
        },
        invokers: {
            show: {
                this: "{that}.dom.splash",
                method: "show"
            },
            hide: {
                this: "{that}.dom.splash",
                method: "hide"
            }
        }
    });

    /**
     * Whether shows or hides the splash window according to current
     * preference sets. The splash window should only be hidden when
     * there are no preference sets passed (the user is keyed out).
     *
     * @param splash {Object} The splash component
     * @param sets {Object[]} The list of currently set components
     */
    gpii.pcp.splash.toggleSplashWindow = function (splash, sets) {
        if (sets && sets.length > 0) {
            splash.hide();
        } else {
            splash.show();
        }
    };

    /**
     * Responsible for drawing the settings list
     *
     * TODO support redrawing of settings
     * currently only single update of available setting is supported
     */
    fluid.defaults("gpii.pcp.mainWindow", {
        gradeNames: ["fluid.viewComponent"],
        model: {
            preferences: {
                sets: [],
                activeSet: null,
                settings: []
            }
        },
        selectors: {
            header: "#flc-settingsHeader",
            settingsList: "#flc-settingsList"
        },
        components: {
            splash: {
                type: "gpii.pcp.splash",
                container: "{that}.container",
                options: {
                    listeners: {
                        "{mainWindow}.events.onPreferencesUpdated": {
                            funcName: "gpii.pcp.splash.toggleSplashWindow",
                            args: ["{that}", "{mainWindow}.model.preferences.sets"]
                        }
                    }
                }
            },
            header: {
                type: "gpii.pcp.header",
                container: "{that}.dom.header"
                // TODO send options
            },
            settingsPanel: {
                type: "gpii.pcp.settingsPanel",
                container: "{that}.dom.settingsList",
                createOnEvent: "{mainWindow}.events.onPreferencesUpdated",
                options: {
                    model: {
                        settings: "{mainWindow}.model.preferences.settings"
                    }
                }
            }
        },
        modelListeners: {
            "preferences.sets": "{that}.events.onPreferencesUpdated"
        },
        listeners: {
            "onCreate.addCommunicationChannel": {
                funcName: "gpii.pcp.addCommunicationChannel",
                args: ["{that}"]
            }
        },
        invokers: {
            "updatePreferences": {
                changePath: "preferences",
                value: "{arguments}.0",
                source: "outer"
            },
            "close": "gpii.pcp.closeSettingsWindow()"
        },
        events: {
            onPreferencesUpdated: null,
            onSettingUpdate: null,
            onKeyOut: null
        }

    });

    $(function () {
        gpii.pcp.mainWindow("#flc-body");
    });
})();