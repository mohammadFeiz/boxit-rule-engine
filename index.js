import { createContext, useContext, useRef, useState } from "react";
import './index.css';
import './style.css';
import AIOInput, { AISelect, AITable, AITabs, AIText } from "aio-input";
import Icon from "@mdi/react";
import { mdiArrowExpandHorizontal, mdiCheckBold, mdiClose, mdiContentSave, mdiDelete, mdiDotsHorizontal, mdiDotsVertical, mdiFileCode, mdiHistory, mdiHome, mdiPlusCircleOutline, mdiPlusThick } from "@mdi/js";
import { AIODate, DragClass, GetRandomNumber } from "aio-utils";
import AIOPopup from "aio-popup";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
const mockTemplate = {
  name: 'template1',
  id: 1235565,
  rows: [{
    cells: ['import com.boxi.ruleEngine.dto.RuleFact;']
  }, {
    cells: ['rule', 'text()']
  }, {
    cells: ['indent', 'no-loop', 'select(["true","false"])']
  }, {
    cells: ['indent', 'lock-on-active', 'select(["true","false"])']
  }, {
    cells: ['indent', 'when']
  }, {
    cells: ['indent', 'indent', 'ruleFact:RuleFact(']
  }, {
    cells: ['indent', 'indent', 'indent', 'textarea()']
  }, {
    cells: ['indent', 'indent', ')']
  }, {
    cells: ['indent', 'then']
  }, {
    cells: ['indent', 'indent', 'textarea()']
  }, {
    cells: ['end']
  }]
};
const CTX = /*#__PURE__*/createContext({});
const RuleEngine = () => {
  const [rules, setRules] = useState(getRules);
  const [templates, setTemplates] = useState(getTemplates);
  const [selectedRule, setSelectedRule] = useState();
  const [selectedVariables, setSelectedVariables] = useState([]);
  const [popup] = useState(new AIOPopup());
  const [model, setModel] = useState({});
  const [history, setHistory] = useState(getHistory);
  function getTemplates() {
    return [mockTemplate];
  }
  function trans(v) {
    const dic = {};
    return dic[v] || v;
  }
  function getRules() {
    return [{
      model: {},
      text: 'text',
      name: 'Rule1',
      id: 0,
      date: '1403/3/3',
      templateId: 1235565,
      variables: [{
        text: '$c'
      }, {
        text: '$w'
      }]
    }, {
      model: {},
      text: 'text',
      name: 'Rule2',
      id: 1,
      date: '1403/3/3',
      templateId: 1235565,
      variables: [{
        text: '$c'
      }, {
        text: '$w'
      }]
    }, {
      model: {},
      text: 'text',
      name: 'Rule3',
      id: 2,
      date: '1403/3/3',
      templateId: 1235565,
      variables: [{
        text: '$c'
      }, {
        text: '$w'
      }]
    }];
  }
  function selectRule(rule) {
    if (rule) {
      changeModel(rule.model);
      changeSelectedVariables(rule.variables || []);
    }
    setSelectedRule(rule);
  }
  function addRule(name, templateId) {
    const DATE = new AIODate();
    const newRule = {
      variables: [],
      text: '',
      templateId,
      name,
      model: {},
      id: GetRandomNumber(100000, 900000),
      date: DATE.getDateByPattern(DATE.getToday(), '{year}/{month}/{day} {hour}:{minute}')
    };
    setRules([...rules, newRule]);
    return true;
  }
  function removeRule(id) {
    const rule = rules.find(o => o.id === id);
    if (!rule) {
      return;
    }
    popup.addConfirm({
      title: 'Remove Rule',
      subtitle: rule.name,
      text: 'َAre You Sure Want To Remove This Rule?',
      onSubmit: async () => {
        setRules(rules.filter(o => o.id !== id));
        return true;
      },
      onCansel: () => {
        popup.removeModal();
      }
    });
  }
  function submitRuleChange() {
    const DATE = new AIODate();
    if (!selectedRule) {
      return;
    }
    const newRule = {
      ...selectedRule,
      variables: selectedVariablesRef.current,
      model: modelRef.current,
      date: DATE.getDateByPattern(DATE.getToday(), '{year}/{month}/{day} {hour}:{minute}')
    };
    setRules(rules.map(o => o.id === selectedRule.id ? newRule : o));
    setSelectedRule(undefined);
  }
  function removeTemplate(id) {
    const template = templates.find(o => o.id === id);
    if (!template) {
      return;
    }
    popup.addConfirm({
      title: 'Remove Template',
      subtitle: template.name,
      text: 'َAre You Sure Want To Remove This Template?',
      onSubmit: async () => {
        const ruleWithThisTemplate = rules.find(o => o.templateId === id);
        if (!!ruleWithThisTemplate) {
          popup.addSnackebar({
            type: 'error',
            text: 'you cannot remove this template',
            subtext: 'There is some rules that use this template',
            verticalAlign: 'start',
            horizontalAlign: 'end',
            attrs: {
              style: {
                maxWidth: 360,
                background: '#111',
                borderRadius: 12,
                border: '2px solid #555',
                fontSize: 16
              }
            }
          });
          return false;
        }
        setTemplates(templates.filter(o => o.id !== id));
        return true;
      },
      onCansel: () => {
        popup.removeModal();
      }
    });
  }
  function getHistory() {
    return [{
      model: {},
      date: '1403/2/3 12:00',
      text: 'text',
      name: 'Rule1',
      id: 0,
      templateId: 0,
      variables: [{
        text: '$c'
      }, {
        text: '$w'
      }]
    }, {
      model: {},
      date: '1403/3/3 12:00',
      text: 'text',
      name: 'Rule1',
      id: 0,
      templateId: 0,
      variables: [{
        text: '$c'
      }, {
        text: '$w'
      }]
    }, {
      model: {},
      date: '1403/3/4 12:00',
      text: 'text',
      name: 'Rule1',
      id: 0,
      templateId: 0,
      variables: [{
        text: '$c'
      }, {
        text: '$w'
      }]
    }];
  }
  const modelRef = useRef(model);
  modelRef.current = model;
  const selectedVariablesRef = useRef(selectedVariables);
  selectedVariablesRef.current = selectedVariables;
  const [Drag] = useState(new DragClass({
    callback: onDrag
  }));
  function changeTemplates(newTemplates) {
    setTemplates([...newTemplates]);
  }
  function onDrag(dragData, dropData) {
    const model = modelRef.current;
    const {
      item
    } = dragData;
    const {
      field
    } = dropData;
    const newValue = (model[field] || '') + item.text;
    changeModel({
      ...model,
      [field]: newValue
    });
  }
  function changeModel(newModel) {
    setModel({
      ...newModel
    });
  }
  function changeSelectedVariables(newVariables) {
    setSelectedVariables([...newVariables]);
  }
  function changeModelByField(field, value) {
    const model = modelRef.current;
    changeModel({
      ...model,
      [field]: value
    });
  }
  function getContext() {
    return {
      rules,
      selectRule,
      selectedRule,
      popup,
      Drag,
      model: modelRef.current,
      changeModelByField,
      history,
      templates,
      changeTemplates,
      trans,
      removeRule,
      removeTemplate,
      addRule,
      submitRuleChange,
      selectedVariables: selectedVariablesRef.current,
      changeSelectedVariables
    };
  }
  return /*#__PURE__*/_jsx(CTX.Provider, {
    value: getContext(),
    children: /*#__PURE__*/_jsxs("div", {
      className: "rule-engine jfullscreen jflex-col",
      children: [/*#__PURE__*/_jsx(Nav, {}), !!selectedRule ? /*#__PURE__*/_jsx(RulePage, {}) : /*#__PURE__*/_jsx(Home, {}), popup.render()]
    })
  });
};
export default RuleEngine;
const AddRule = ({
  onSubmit
}) => {
  const {
    templates
  } = useContext(CTX);
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState();
  const [errors, setErrors] = useState({});
  return /*#__PURE__*/_jsxs("div", {
    className: "add-rule",
    children: [/*#__PURE__*/_jsx("div", {
      className: "add-rule-label",
      children: "Rule Name"
    }), /*#__PURE__*/_jsx(AIText, {
      value: name,
      onChange: v => setName(v),
      validations: ['required'],
      lang: "en",
      reportError: error => setErrors({
        ...errors,
        name: error
      })
    }), /*#__PURE__*/_jsx("div", {
      className: "add-rule-label",
      children: "Rule Template"
    }), /*#__PURE__*/_jsx(AISelect, {
      options: templates,
      subtext: templateId !== undefined ? templateId : undefined,
      validations: ['required'],
      value: templateId,
      option: {
        text: 'option.name',
        value: 'option.id',
        subtext: option => option.id
      },
      popover: {
        fitHorizontal: true
      },
      onChange: templateId => setTemplateId(templateId),
      reportError: error => setErrors({
        ...errors,
        template: error
      })
    }), /*#__PURE__*/_jsx("div", {
      className: "msf"
    }), /*#__PURE__*/_jsx("button", {
      type: "button",
      disabled: !!errors.name || !!errors.template,
      onClick: () => onSubmit(name, templateId),
      children: "Add Rule"
    })]
  });
};
const RulePage = () => {
  const [tab, setTab] = useState('variables');
  function left_side_layout() {
    return /*#__PURE__*/_jsxs("div", {
      className: "jw-204 jflex-col jshrink-0 rule-engine-border-right",
      children: [/*#__PURE__*/_jsx(AITabs, {
        value: tab,
        onChange: tab => setTab(tab),
        options: [{
          text: 'lists',
          value: 'lists'
        }, {
          text: 'variables',
          value: 'variables'
        }]
      }), tab === 'variables' && /*#__PURE__*/_jsx(Variables, {})]
    });
  }
  return /*#__PURE__*/_jsxs("div", {
    className: " jflex-row jflex-1",
    children: [left_side_layout(), /*#__PURE__*/_jsx(RuleCode, {}), /*#__PURE__*/_jsx(History, {})]
  });
};
const Nav = () => {
  const {
    selectedRule,
    selectRule,
    trans
  } = useContext(CTX);
  return /*#__PURE__*/_jsxs("nav", {
    className: "rule-engine-nav",
    children: [/*#__PURE__*/_jsx("div", {
      className: "rule-engine-app-title",
      children: "RULE ENGINE"
    }), !!selectedRule && /*#__PURE__*/_jsxs(_Fragment, {
      children: [/*#__PURE__*/_jsx("div", {
        className: "rule-engine-rule-name",
        children: selectedRule.name
      }), /*#__PURE__*/_jsx("div", {
        className: "jflex-row jw-144 jalign-vh",
        children: /*#__PURE__*/_jsxs("button", {
          type: "button",
          className: "jflex-row jalign-v jgap-6",
          onClick: () => selectRule(undefined),
          children: [/*#__PURE__*/_jsx(Icon, {
            path: mdiHome,
            size: 0.9
          }), trans('Home')]
        })
      })]
    })]
  });
};
const Variables = () => {
  const {
    popup,
    selectedRule,
    Drag,
    selectedVariables,
    changeSelectedVariables
  } = useContext(CTX);
  function removeVariable(index) {
    popup.addConfirm({
      title: 'Remove Variable',
      text: 'Are you sure want to remove this variable?',
      subtitle: selectedVariables[index].text,
      onSubmit: async () => {
        changeSelectedVariables(selectedVariables.filter((o, i) => i !== index));
        return true;
      }
    });
  }
  function addVariableModal() {
    popup.addPrompt({
      title: 'Add Variable',
      text: 'inter variable',
      onSubmit: async text => {
        changeSelectedVariables([...selectedVariables, {
          text
        }]);
        return true;
      }
    });
  }
  function item_layout(item, index) {
    return /*#__PURE__*/_jsxs("div", {
      className: "jflex-row jp-6 jbrd-c-5 jflex-row jalign-v",
      ...Drag.getDragAttrs({
        item
      }),
      children: [/*#__PURE__*/_jsx("div", {
        className: "jflex-1",
        children: item.text
      }), /*#__PURE__*/_jsx("div", {
        className: "jw-24 jh-24 jflex-row jalign-vh",
        onClick: () => removeVariable(index),
        children: /*#__PURE__*/_jsx(Icon, {
          path: mdiClose,
          size: 0.7
        })
      })]
    }, item.text);
  }
  function hedaer_layout() {
    return /*#__PURE__*/_jsx("div", {
      className: "msf jflex-row jalign-v jp-6 jalign-vh",
      children: /*#__PURE__*/_jsxs("button", {
        type: "button",
        className: "jflex-row jalign-v",
        style: {
          color: 'orange',
          background: 'none'
        },
        onClick: () => addVariableModal(),
        children: [/*#__PURE__*/_jsx(Icon, {
          path: mdiPlusThick,
          size: 0.7
        }), "Add Variable"]
      })
    });
  }
  function body_layout() {
    if (!selectedRule) {
      return null;
    }
    return /*#__PURE__*/_jsx("div", {
      className: "jflex-col jgap-3 jp-3 jflex-1 jofy-auto",
      children: selectedVariables.map((o, i) => item_layout(o, i))
    });
  }
  return /*#__PURE__*/_jsxs(_Fragment, {
    children: [hedaer_layout(), " ", body_layout()]
  });
};
const RuleCode = () => {
  const {
    selectedRule,
    templates,
    trans,
    submitRuleChange
  } = useContext(CTX);
  const [template] = useState(getTemplate);
  function getTemplate() {
    return templates.find(o => o.id === (selectedRule === null || selectedRule === void 0 ? void 0 : selectedRule.templateId));
  }
  const [mode, setMode] = useState('editor');
  if (!selectedRule) {
    return null;
  }
  function template_rows_layout() {
    const {
      rows
    } = template;
    return rows.map((row, rowIndex) => template_row_layout(row, rowIndex));
  }
  function template_row_layout(row, rowIndex) {
    const {
      cells = []
    } = row;
    if (!cells.length) {
      return null;
    }
    return /*#__PURE__*/_jsxs("div", {
      className: "jflex-row jalign-v",
      children: [template_cells_layout(cells, rowIndex), options_layout()]
    });
  }
  function options_layout() {
    return /*#__PURE__*/_jsx("div", {
      className: "jflex-row jalign-vh",
      children: /*#__PURE__*/_jsx(Icon, {
        path: mdiDotsVertical,
        size: 0.8
      })
    });
  }
  function template_cells_layout(cells, rowIndex) {
    return /*#__PURE__*/_jsx("div", {
      className: "jflex-row jflex-1 jalign-v jgap-6 jh-100",
      children: cells.map((cell, cellIndex) => /*#__PURE__*/_jsx(CodeCell, {
        cell: cell,
        rowIndex: rowIndex,
        cellIndex: cellIndex
      }))
    });
  }
  return /*#__PURE__*/_jsxs("div", {
    className: "jflex-col jw-100 rule-engine-border-left rule-engine-border-right",
    children: [/*#__PURE__*/_jsx(AITabs, {
      value: mode,
      onChange: mode => setMode(mode),
      options: [{
        text: 'Editor',
        value: 'editor'
      }, {
        text: 'Preview',
        value: 'preview'
      }],
      before: /*#__PURE__*/_jsxs("button", {
        className: "rule-engine-save jalign-v jflex-row jgap-6 jfs-14 jbold",
        onClick: submitRuleChange,
        children: [/*#__PURE__*/_jsx(Icon, {
          path: mdiContentSave,
          size: 1
        }), trans('Save')]
      })
    }), /*#__PURE__*/_jsx("div", {
      className: "jflex-col jflex-1 jp-12 jgap-3 jofy-auto jw-100",
      children: template_rows_layout()
    })]
  });
};
const CodeCell = ({
  cell,
  rowIndex,
  cellIndex
}) => {
  const {
    Drag,
    model,
    changeModelByField
  } = useContext(CTX);
  function select_layout(selectfield, options) {
    let value = model[selectfield];
    return /*#__PURE__*/_jsx(AIOInput, {
      type: "select",
      className: "jw-fit jbg-l-5 jbrd-none",
      options: options,
      value: value,
      onChange: newValue => changeModelByField(selectfield, newValue),
      option: {
        text: 'option',
        value: 'option'
      },
      validations: ['required'],
      lang: "en",
      showErrors: false
    });
  }
  function text_layout(field) {
    return /*#__PURE__*/_jsx(AIOInput, {
      type: "text",
      className: "jw-fit jbg-l-5 jbrd-none",
      value: model[field] || '',
      onChange: newValue => changeModelByField(field, newValue),
      validations: ['required'],
      lang: "en",
      showErrors: false
    });
  }
  function textarea_layout(field) {
    const dragAttrs = Drag.getDropAttrs({
      field
    });
    return /*#__PURE__*/_jsx(AIOInput, {
      attrs: {
        ...dragAttrs
      },
      type: "textarea",
      className: "jflex-1 jbg-l-5 jbrd-none",
      inputAttrs: {
        className: 'resize-v'
      },
      value: model[field] || '',
      onChange: newValue => changeModelByField(field, newValue),
      autoHighlight: false,
      validations: ['required'],
      lang: "en",
      showErrors: false
    });
  }
  const field = `field-${rowIndex}-${cellIndex}`;
  if (cell.indexOf('select(') === 0) {
    const optionsString = cell.slice(7, cell.length - 1);
    const options = JSON.parse(optionsString);
    return select_layout(field, options);
  }
  if (cell.indexOf('text(') === 0) {
    return text_layout(field);
  }
  if (cell.indexOf('textarea(') === 0) {
    return textarea_layout(field);
  }
  if (cell === 'indent') {
    return /*#__PURE__*/_jsx(Indent, {});
  }
  return /*#__PURE__*/_jsx("div", {
    className: "jflex-row",
    children: cell
  });
};
const History = () => {
  const {
    history,
    trans
  } = useContext(CTX);
  function header_layout() {
    return /*#__PURE__*/_jsxs("div", {
      className: "msf jflex-row jalign-v jp-6 jalign-vh jbg-d-20 jfs-14 jgap-6",
      style: {
        color: 'orange'
      },
      children: [/*#__PURE__*/_jsx(Icon, {
        path: mdiHistory,
        size: 0.8
      }), " ", trans('History')]
    });
  }
  function item_layout(historyItems) {
    return /*#__PURE__*/_jsx("div", {
      className: "jflex-row jp-6 jbrd-c-5 jflex-row jalign-v",
      children: /*#__PURE__*/_jsxs("div", {
        className: "jflex-1 jflex-row jalign-v",
        children: [/*#__PURE__*/_jsx("div", {
          className: "jw-36 jh-24 jflex-row jalign-vh",
          style: {
            color: 'orange'
          },
          children: /*#__PURE__*/_jsx(Icon, {
            path: mdiFileCode,
            size: 0.7
          })
        }), /*#__PURE__*/_jsx("div", {
          className: "jfs-12",
          children: historyItems.date
        })]
      })
    }, historyItems.date);
  }
  function items_layout() {
    return /*#__PURE__*/_jsx("div", {
      className: "jflex-col jgap-3 jp-3 jflex-1 jofy-auto",
      children: history.reverse().map(o => item_layout(o))
    });
  }
  return /*#__PURE__*/_jsxs("div", {
    className: "jw-204 jflex-col jshrink-0 rule-engine-border-left",
    children: [header_layout(), " ", items_layout()]
  });
};
const Home = () => {
  const {
    popup,
    rules,
    templates,
    selectRule,
    changeTemplates,
    removeTemplate,
    removeRule,
    addRule
  } = useContext(CTX);
  const [templateToEdit, setTemplateToEdit] = useState();
  const [templateToAdd, setTemplateToAdd] = useState(false);
  function addRuleModal() {
    popup.addModal({
      header: {
        title: 'AddRule'
      },
      position: 'center',
      body: () => /*#__PURE__*/_jsx(AddRule, {
        onSubmit: async (name, templateId) => {
          const res = await addRule(name, templateId);
          if (res) {
            popup.removeModal();
          }
        }
      })
    });
  }
  function part_header_layout(label, onAdd) {
    return /*#__PURE__*/_jsxs("div", {
      className: "jfs-24 jm-b-12 jflex-row jalign-between jalign-v jw-100 jp-jh-12 jh-48",
      style: {
        color: 'orange',
        background: 'rgba(255,255,255,0.2)'
      },
      children: [/*#__PURE__*/_jsx("div", {
        className: "msf",
        children: label
      }), /*#__PURE__*/_jsx("div", {
        className: "jflex-row jalign-vh pointer",
        onClick: onAdd,
        children: /*#__PURE__*/_jsx(Icon, {
          path: mdiPlusCircleOutline,
          size: 1.4
        })
      })]
    });
  }
  function part_body_layout(items) {
    return /*#__PURE__*/_jsx("div", {
      className: "jflex-1 jofy-auto jflex-col jgap-12 jw-100 jalign-h jp-12",
      children: items
    });
  }
  function part_layout(label, items, onAdd) {
    return /*#__PURE__*/_jsxs("div", {
      className: "jflex-col jalign-h jh-100 jp-12 jbr-12 jw-100",
      children: [part_header_layout(label, onAdd), " ", part_body_layout(items)]
    });
  }
  function rules_layout() {
    const items = rules.map(rule => {
      return part_item_layout({
        id: rule.id,
        text: rule.name,
        subtext: rule.date,
        onClick: () => selectRule(rule),
        onRemove: () => removeRule(rule.id)
      });
    });
    return part_layout('Rules', items, () => addRuleModal());
  }
  function templates_layout() {
    const items = templates.map(template => {
      return part_item_layout({
        id: template.id,
        text: template.name,
        onClick: () => setTemplateToEdit(template),
        onRemove: () => removeTemplate(template.id)
      });
    });
    return part_layout('Templates', items, () => setTemplateToAdd(true));
  }
  function part_item_layout(p) {
    const {
      id,
      text,
      subtext,
      onClick,
      onRemove
    } = p;
    return /*#__PURE__*/_jsxs("div", {
      className: "part-button",
      children: [/*#__PURE__*/_jsxs("div", {
        className: "part-button-body",
        onClick: onClick,
        children: [/*#__PURE__*/_jsx("div", {
          className: "",
          children: text
        }), subtext !== undefined && /*#__PURE__*/_jsx("div", {
          className: "jop-60 jfs-p70",
          children: subtext
        })]
      }), /*#__PURE__*/_jsx("div", {
        className: "part-button-remove",
        onClick: () => onRemove(),
        children: /*#__PURE__*/_jsx(Icon, {
          path: mdiClose,
          size: 0.7
        })
      })]
    }, id);
  }
  if (templateToAdd) {
    return /*#__PURE__*/_jsx(Template, {
      mode: "add",
      onSubmit: newTemplate => {
        changeTemplates([...templates, newTemplate]);
        setTemplateToAdd(false);
      }
    });
  }
  if (templateToEdit) {
    return /*#__PURE__*/_jsx(Template, {
      mode: "edit",
      template: templateToEdit,
      onSubmit: newTemplate => {
        changeTemplates(templates.map(o => o.id === templateToEdit.id ? newTemplate : o));
        setTemplateToEdit(undefined);
      }
    });
  }
  return /*#__PURE__*/_jsxs("div", {
    className: "jflex-row jalign-h jflex-1 jp-12",
    children: [rules_layout(), " ", templates_layout()]
  });
};
const TemplateContext = /*#__PURE__*/createContext({});
const Template = props => {
  const {
    popup
  } = useContext(CTX);
  const {
    mode
  } = props;
  const [template, setTemplate] = useState(getTemplate);
  function getTemplate() {
    if (mode === 'edit') {
      return JSON.parse(JSON.stringify(props.template));
    }
    return {
      id: GetRandomNumber(100000, 900000),
      name: '',
      rows: []
    };
  }
  function header_layout() {
    let title = '',
      submitText = '';
    if (mode === 'edit') {
      title = `Edit Template (${template.name})`;
      submitText = 'Edit';
    } else if (mode === 'add') {
      title = 'Add Template';
      submitText = 'Add';
    }
    return /*#__PURE__*/_jsxs("div", {
      className: "jbg-d-20 jp-jh-24 jfs-14 jbold jflex-row jh-36 jalign-v",
      children: [title, /*#__PURE__*/_jsx("div", {
        className: "jflex-1"
      }), /*#__PURE__*/_jsx("button", {
        onClick: () => props.onSubmit(template),
        style: {
          background: 'orange',
          border: 'none'
        },
        className: "jbr-4 jh-30 jw-72",
        children: submitText
      })]
    });
  }
  function body_layout() {
    return /*#__PURE__*/_jsx("div", {
      className: "jflex-col jp-24",
      children: template.rows.map((o, rowIndex) => /*#__PURE__*/_jsx(TemplateRow, {
        row: o,
        rowIndex: rowIndex
      }, rowIndex))
    });
  }
  function changeCell(value, rowIndex, cellIndex) {
    const row = template.rows[rowIndex];
    const newCells = row.cells.map((cell, i) => i !== cellIndex ? cell : value);
    const newRow = {
      ...row,
      cells: newCells
    };
    const newRows = template.rows.map((row, i) => i !== rowIndex ? row : newRow);
    setTemplate({
      ...template,
      rows: newRows
    });
  }
  function addCell(type, rowIndex, isEmptyRow) {
    let newRows = [];
    let newCell = '';
    if (type === 'static_text') {
      newCell = 'text';
    } else if (type === 'textbox') {
      newCell = 'text()';
    } else if (type === 'code_block') {
      newCell = 'textarea()';
    } else if (type === 'indent') {
      newCell = 'indent';
    } else {
      newCell = 'select([])';
    }
    if (isEmptyRow) {
      let tempRows = [];
      for (let i = 0; i < template.rows.length; i++) {
        if (i === rowIndex) {
          tempRows.push(template.rows[i], {
            cells: [newCell]
          });
        } else {
          tempRows.push(template.rows[i]);
        }
      }
      newRows = tempRows;
    } else {
      newRows = template.rows.map((row, i) => i !== rowIndex ? row : {
        ...row,
        cells: [...row.cells, newCell]
      });
    }
    setTemplate({
      ...template,
      rows: newRows
    });
  }
  function removeCell(rowIndex) {
    const row = template.rows[rowIndex];
    const newRow = {
      ...row,
      cells: row.cells.filter((cell, i) => i !== row.cells.length - 1)
    };
    let newRows = [];
    if (!newRow.cells.length) {
      newRows = template.rows.filter((o, i) => i !== rowIndex);
    } else {
      newRows = template.rows.map((row, i) => i !== rowIndex ? row : newRow);
    }
    setTemplate({
      ...template,
      rows: newRows
    });
  }
  function getContext() {
    return {
      popup,
      removeCell,
      addCell,
      changeCell
    };
  }
  return /*#__PURE__*/_jsx(TemplateContext.Provider, {
    value: getContext(),
    children: /*#__PURE__*/_jsxs("div", {
      className: "jh-100 jw-100 jofy-auto",
      children: [header_layout(), " ", body_layout()]
    })
  });
};
const TemplateRow = ({
  row,
  rowIndex
}) => {
  const {
    removeCell,
    addCell
  } = useContext(TemplateContext);
  function addCell_layout(rowIndex, isEmptyRow) {
    return /*#__PURE__*/_jsxs("div", {
      className: "jflex-row jalign-v",
      children: [/*#__PURE__*/_jsx("button", {
        type: "button",
        className: "jbg-none jbrd-none jw-24 jh-24 jflex-row jalign-vh jp-0",
        style: {
          color: 'orange',
          opacity: isEmptyRow ? 0 : 1
        },
        onClick: () => removeCell(rowIndex),
        children: /*#__PURE__*/_jsx(Icon, {
          path: mdiDelete,
          size: 0.7
        })
      }), /*#__PURE__*/_jsx(AISelect, {
        className: "jw-24 jh-24 jp-0 jm-l-6 jbrd-none jp-0",
        caret: false,
        style: {
          color: 'lightgreen',
          background: 'none'
        },
        text: /*#__PURE__*/_jsx(Icon, {
          path: mdiPlusThick,
          size: 0.7
        }),
        option: {
          before: () => /*#__PURE__*/_jsx(Icon, {
            path: mdiPlusThick,
            size: 0.7
          })
        },
        options: [{
          text: 'Static Text',
          value: 'static_text'
        }, {
          text: 'Select',
          value: 'select'
        }, {
          text: 'Textbox',
          value: 'textbox'
        }, {
          text: 'Code Block',
          value: 'code_block'
        }, {
          text: 'Indent',
          value: 'indent'
        }],
        onChange: v => addCell(v, rowIndex, isEmptyRow)
      })]
    }, `addRojw-${rowIndex}-${isEmptyRow}`);
  }
  return /*#__PURE__*/_jsxs(_Fragment, {
    children: [/*#__PURE__*/_jsxs("div", {
      className: "jflex-row jalign-v jgap-12",
      children: [addCell_layout(rowIndex, false), row.cells.map((o, cellIndex) => /*#__PURE__*/_jsx(TemplateCell, {
        cell: o,
        rowIndex: rowIndex,
        cellIndex: cellIndex
      }, cellIndex))]
    }, rowIndex), addCell_layout(rowIndex, true)]
  });
};
const TemplateCell = ({
  cell,
  rowIndex,
  cellIndex
}) => {
  const {
    popup,
    changeCell
  } = useContext(TemplateContext);
  function openOptionsModal(options, rowIndex, cellIndex) {
    popup.addModal({
      position: 'center',
      header: {
        title: 'Edit Options'
      },
      body: () => {
        return /*#__PURE__*/_jsx(CellOptions, {
          options: options,
          onChange: newOptions => {
            const options = newOptions.map(o => o.text);
            const newCell = `select(${JSON.stringify(options)})`;
            changeCell(newCell, rowIndex, cellIndex);
            popup.removeModal();
          }
        });
      }
    });
  }
  function getContent() {
    if (cell === 'indent') {
      return /*#__PURE__*/_jsx("div", {
        className: "jw-16 jh-24 jflex-row jalign-vh jm-2 jop-15",
        children: /*#__PURE__*/_jsx(Icon, {
          path: mdiArrowExpandHorizontal,
          size: 0.8
        })
      });
    }
    if (cell.indexOf('text(') === 0) {
      return /*#__PURE__*/_jsx("div", {
        className: "jp-jh-6 jbr-4",
        style: {
          background: '#0069ff'
        },
        children: "TextBox"
      });
    }
    if (cell.indexOf('textarea(') === 0) {
      return /*#__PURE__*/_jsx("div", {
        className: "jp-jh-6 jbr-4",
        style: {
          background: '#0069ff'
        },
        children: "Code Block"
      });
    }
    if (cell.indexOf('select(') === 0) {
      return select_layout(cell, rowIndex, cellIndex);
    }
    return static_text_layout(cell, rowIndex, cellIndex);
  }
  function select_layout(cell, rowIndex, cellIndex) {
    const options = JSON.parse(cell.slice(7, cell.length - 1));
    return /*#__PURE__*/_jsxs("div", {
      className: "jp-jh-6 jbr-4 jrelative jpointer jflex-row jalign-v",
      style: {
        background: '#0069ff'
      },
      onClick: () => openOptionsModal(options, rowIndex, cellIndex),
      children: ["Select", /*#__PURE__*/_jsx("div", {
        className: "jfs-p70 jop-70 jm-l-6",
        children: ` ( ${options.length} options )`
      }), select_cell_icon()]
    });
  }
  function select_cell_icon() {
    return /*#__PURE__*/_jsx("div", {
      className: "jabsolute jw-16 jh-16 jflex-row jalign-vh jbr-100",
      style: {
        background: 'orange',
        top: -8,
        right: -8
      },
      children: /*#__PURE__*/_jsx(Icon, {
        path: mdiDotsHorizontal,
        size: 0.6
      })
    });
  }
  function static_text_layout(cell, rowIndex, cellIndex) {
    const width = cell.length * 6.2 + 12;
    return /*#__PURE__*/_jsx(AIText, {
      value: cell,
      style: {
        width
      },
      autoHighlight: false,
      className: "jbg-0 jp-jh-0 jbr-4 jm-l-6 jbrd-none jh-24",
      onChange: newValue => changeCell(newValue, rowIndex, cellIndex)
    });
  }
  return /*#__PURE__*/_jsx("div", {
    className: "jflex-row jalign-v",
    children: getContent()
  }, `rowIndex-${rowIndex}-cellIndex-${cellIndex}`);
};
const Indent = () => /*#__PURE__*/_jsx("div", {
  className: "jw-12 jh-100 jshrink-0 jflex-row jalign-v jshrink-0",
  children: /*#__PURE__*/_jsx("div", {
    className: "jw-1 jh-100 jbg-l-20"
  })
});
const CellOptions = props => {
  const [options, setOptions] = useState(JSON.parse(JSON.stringify(props.options)).map(text => ({
    text
  })));
  return /*#__PURE__*/_jsxs("div", {
    className: "jp-12",
    children: [/*#__PURE__*/_jsx(AITable, {
      value: options,
      rowGap: 1,
      className: "rule-engine-options-table",
      headerAttrs: {
        style: {
          display: 'none'
        }
      },
      columns: [{
        title: 'Option',
        value: 'row.text',
        input: {
          type: 'text',
          delay: 50
        },
        justify: true
      }],
      onAdd: () => setOptions([...options, {
        text: ''
      }]),
      addText: /*#__PURE__*/_jsxs("div", {
        className: "jflex-row jalign-v jp-jh-12 jh-24 jbr-4 jm-jh-6 jbold jm-3",
        style: {
          color: 'orange'
        },
        children: [/*#__PURE__*/_jsx(Icon, {
          path: mdiPlusThick,
          size: 0.7
        }), " Add Option"]
      }),
      onRemove: true,
      onChange: newOptions => setOptions(newOptions)
    }), /*#__PURE__*/_jsx("div", {
      className: "jh-36 jflex-row jalign-v jp-v-6",
      children: /*#__PURE__*/_jsxs("button", {
        type: "button",
        className: "jbrd-none jbr-4 jp-v-3 jp-jh-12 jbold jfs-14 jc-4 jflex-row jalign-v jgap-6",
        style: {
          background: 'orange'
        },
        onClick: () => props.onChange(options),
        children: [/*#__PURE__*/_jsx(Icon, {
          path: mdiCheckBold,
          size: 0.7
        }), "Submit"]
      })
    })]
  });
};