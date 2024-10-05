import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import AIOInput, { Code, AISelect, AITable, AITabs, AIText, AIButtons, AIDate, AICard, AIPanel, AISwitch, AISlider, AITextarea, AICheckbox } from "aio-input";
import Icon from "@mdi/react";
//swagger
//http://192.168.88.243:8090/swagger-ui/index.html#/rule-controller/update
import { mdiAlert, mdiArrowCollapseLeft, mdiArrowCollapseRight, mdiArrowExpandHorizontal, mdiCheckBold, mdiClose, mdiCloseCircle, mdiContentCopy, mdiDelete, mdiDotsHorizontal, mdiFileCode, mdiHistory, mdiHome, mdiInformation, mdiPlusCircleOutline, mdiPlusThick } from "@mdi/js";
import { AIODate, DragClass, GetRandomNumber } from "aio-utils";
import AIOPopup from "aio-popup";
import AIOApis from "aio-apis";
import './index.css';
import './style.css';
import './theme3.css';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
const CTX = /*#__PURE__*/createContext({});
const RuleEngine = ({
  onExit,
  token,
  variables = [],
  baseUrl
}) => {
  const [rules, setRules] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedRule, setSelectedRule] = useState();
  const [selectedTemplate, setSelectedTemplate] = useState();
  const [popup] = useState(new AIOPopup());
  const [model, setModel] = useState({});
  const [mode, setMode] = useState();
  const [errors, setErrors] = useState([]);
  const [history, setHistory] = useState([]);
  const [apis] = useState(new apisClass(token, baseUrl));
  let [validateTimeout] = useState();
  useEffect(() => {
    getRules();
    getTemplates();
    getHistory();
  }, []);
  useEffect(() => {
    validateCode();
  }, [!!selectedRule, JSON.stringify(model)]);
  async function getTemplates() {
    const templates = await apis.get_templates();
    setTemplates(templates);
  }
  function trans(v) {
    const dic = {};
    return dic[v] || v;
  }
  function getFieldByIndex(rowIndex, cellIndex) {
    return `field-${rowIndex}-${cellIndex}`;
  }
  function getIndexByField(field) {
    const [starter, rowIndex, cellIndex] = field.split('-');
    return {
      rowIndex: +rowIndex,
      cellIndex: +cellIndex,
      starter
    };
  }
  function getDynamicByModel(model) {
    let res = {};
    for (let prop in model) {
      const {
        rowIndex,
        cellIndex
      } = getIndexByField(prop);
      let row = res['a' + rowIndex] || {};
      row['a' + cellIndex] = {
        field: prop,
        value: model[prop]
      };
      res['a' + rowIndex] = row;
    }
    return res;
  }
  function validateCode() {
    clearTimeout(validateTimeout);
    validateTimeout = setTimeout(async () => {
      if (selectedRule) {
        const code = generatePreview();
        const fixedCode = code.replace(/\n/g, ' ');
        console.log(fixedCode);
        const res = await apis.validate(fixedCode);
        changeRule({
          finalCode: code
        });
        setErrors(res);
      }
    }, 1000);
  }
  function generatePreview() {
    const template = selectedTemplate;
    if (!template) {
      return '';
    }
    let preview = '\n';
    let dynamic_dic = getDynamicByModel(model);
    for (let rowIndex = 0; rowIndex < template.rows.length; rowIndex++) {
      const row = template.rows[rowIndex];
      for (let cellIndex = 0; cellIndex < row.cells.length; cellIndex++) {
        const cell = row.cells[cellIndex];
        if (dynamic_dic['a' + rowIndex] && dynamic_dic['a' + rowIndex]['a' + cellIndex]) {
          const {
            value
          } = dynamic_dic['a' + rowIndex]['a' + cellIndex];
          preview += value + ' ';
        } else if (cell === 'indent') {
          preview += '  ';
        } else if (cell.indexOf('text(') === 0) {
          preview += '';
        } else if (cell.indexOf('textarea(') === 0) {
          preview += '';
        } else if (cell.indexOf('select(') === 0) {
          preview += '';
        } else {
          preview += cell + ' ';
        }
      }
      preview += '\n';
    }
    return preview;
  }
  function generateRuleByState(obj) {
    return {
      ...selectedRule,
      model: {
        ...model
      },
      finalCode: generatePreview(),
      ...obj
    };
  }
  async function getRules() {
    const rules = await apis.get_rules();
    console.log(rules);
    setRules(rules);
  }
  async function addRule() {
    if (!selectedRule) {
      return false;
    }
    const res = await apis.add_rule({
      ...selectedRule,
      model: JSON.stringify(model)
    });
    if (res !== false) {
      const newRule = generateRuleByState({
        id: res
      });
      setRules([...rules, newRule]);
      return true;
    }
    return false;
  }
  async function cloneRule(rule) {
    const name = window.prompt('inter rule name to clone');
    if (!name || name === null) {
      return;
    }
    const newRule = {
      ...rule,
      name,
      model: JSON.stringify(rule.model)
    };
    const res = await apis.add_rule(newRule);
    if (res !== false) {
      setRules([...rules, {
        ...newRule,
        id: res
      }]);
      return true;
    }
    return false;
  }
  async function editRule() {
    if (!selectedRule) {
      return false;
    }
    const res = await apis.edit_rule({
      ...selectedRule,
      model: JSON.stringify(model)
    });
    if (res !== false) {
      const newRule = generateRuleByState();
      const newRules = rules.map(o => o.id === newRule.id ? newRule : o);
      setRules(newRules);
      return true;
    }
    return false;
  }
  function selectRule(rule, mode) {
    if (rule) {
      changeModel(rule.model);
      const template = JSON.parse(rule.template);
      if (template) {
        changeSelectedTemplate(template);
      } else {
        console.error('error543467344');
      }
    }
    setMode(mode);
    setSelectedRule(rule ? JSON.parse(JSON.stringify(rule)) : undefined);
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
        const res = await apis.remove_rule(rule.id);
        if (res) {
          setRules(rules.filter(o => o.id !== id));
          return true;
        }
        return false;
      },
      onCansel: () => popup.removeModal()
    });
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
        const res = await apis.remove_template(id);
        if (res) {
          setTemplates(templates.filter(o => o.id !== id));
          return true;
        }
        return false;
      },
      onCansel: () => popup.removeModal()
    });
  }
  async function getHistory() {
    const res = await apis.history();
    setHistory(res);
  }
  const modelRef = useRef(model);
  modelRef.current = model;
  const [Drag] = useState(new DragClass({
    callback: onDrag
  }));
  async function addTemplate(newTemplate) {
    const res = await apis.add_template({
      ...newTemplate,
      id: 0
    });
    if (typeof res === 'number') {
      setTemplates([...templates, {
        ...newTemplate,
        id: res
      }]);
      return true;
    }
    return false;
  }
  async function editTemplate(newTemplate) {
    const res = await apis.edit_template(newTemplate);
    if (res) {
      setTemplates(templates.map(o => o.id === newTemplate.id ? newTemplate : o));
      return true;
    }
    return false;
  }
  function onDrag(dragData, dropData) {
    const model = modelRef.current,
      {
        item,
        type
      } = dragData,
      {
        field
      } = dropData;
    let newValue = model[field] || '';
    if (type === 'variable') {
      newValue += item.text;
    } else if (type === 'rule') {
      newValue += item.finalCode;
    }
    changeModel({
      ...model,
      [field]: newValue
    });
  }
  function changeModel(newModel) {
    const finalCode = generatePreview();
    setSelectedRule({
      ...selectedRule,
      finalCode
    });
    setModel({
      ...newModel
    });
  }
  function changeRule(obj) {
    const newSelectedRule = {
      ...selectedRule,
      ...obj
    };
    setSelectedRule(newSelectedRule);
  }
  function changeSelectedTemplate(template) {
    setSelectedTemplate(template);
  }
  function changeModelByField(field, value) {
    changeModel({
      ...modelRef.current,
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
      addTemplate,
      editTemplate,
      trans,
      removeRule,
      removeTemplate,
      addRule,
      getFieldByIndex,
      getIndexByField,
      variables,
      getDynamicByModel,
      generatePreview,
      apis,
      editRule,
      onExit,
      selectedTemplate,
      changeSelectedTemplate,
      changeRule,
      errors,
      validateCode,
      mode,
      cloneRule
    };
  }
  return /*#__PURE__*/_jsx(CTX.Provider, {
    value: getContext(),
    children: /*#__PURE__*/_jsxs("div", {
      className: "rule-engine app-container theme2",
      children: [/*#__PURE__*/_jsx(Nav, {}), /*#__PURE__*/_jsx("div", {
        className: "app-body",
        children: !!selectedRule ? /*#__PURE__*/_jsx(RulePage, {}) : /*#__PURE__*/_jsx(Home, {})
      }), popup.render()]
    })
  });
};
export default RuleEngine;
const RulePage = () => {
  const {
    selectedRule,
    selectedTemplate,
    changeRule,
    generatePreview
  } = useContext(CTX);
  const [tab, setTab] = useState('variables');
  useEffect(() => {
    if (!(selectedRule !== null && selectedRule !== void 0 && selectedRule.finalCode)) {
      changeRule({
        finalCode: generatePreview()
      });
    }
  }, []);
  function left_side_layout() {
    return /*#__PURE__*/_jsxs("div", {
      className: "jw-204 jflex-col jshrink-0 theme2-border-right jbg-d-90",
      children: [/*#__PURE__*/_jsx(AITabs, {
        value: tab,
        onChange: tab => setTab(tab),
        options: [{
          text: 'rules',
          value: 'rules'
        }, {
          text: 'variables',
          value: 'variables'
        }]
      }), tab === 'variables' && /*#__PURE__*/_jsx(Variables, {}), tab === 'rules' && /*#__PURE__*/_jsx(DraggableRules, {})]
    });
  }
  return /*#__PURE__*/_jsxs("div", {
    className: " jflex-row jflex-1 jh-100 theme2-border-top",
    children: [left_side_layout(), !!selectedTemplate && /*#__PURE__*/_jsx(Rule, {})]
  });
};
const Nav = () => {
  const {
    selectedRule,
    selectRule,
    trans,
    onExit
  } = useContext(CTX);
  return /*#__PURE__*/_jsxs("nav", {
    className: "app-nav",
    children: [/*#__PURE__*/_jsx("div", {
      className: "rule-engine-app-title",
      children: "RULE ENGINE"
    }), !!selectedRule && /*#__PURE__*/_jsxs(_Fragment, {
      children: [/*#__PURE__*/_jsx("div", {
        className: "jflex-1 jflex-row jalign-vh jc-16",
        children: selectedRule.name
      }), /*#__PURE__*/_jsx("div", {
        className: "jflex-row jw-144 jalign-vh",
        children: /*#__PURE__*/_jsxs("button", {
          type: "button",
          className: "theme2-button-1",
          onClick: () => selectRule(undefined, undefined),
          children: [/*#__PURE__*/_jsx(Icon, {
            path: mdiHome,
            size: 0.9
          }), trans('Home')]
        })
      })]
    }), !selectedRule && /*#__PURE__*/_jsxs(_Fragment, {
      children: [/*#__PURE__*/_jsx("div", {
        className: "jflex-1"
      }), /*#__PURE__*/_jsx("button", {
        className: "theme2-button-1",
        onClick: () => onExit(),
        children: "Exit"
      })]
    })]
  });
};
const Variables = () => {
  const {
    selectedRule,
    Drag,
    variables
  } = useContext(CTX);
  function item_layout(item, index) {
    return /*#__PURE__*/_jsx("div", {
      className: "jflex-row jp-6 jbrd-c-5 jflex-row jalign-v",
      ...Drag.getDragAttrs({
        item,
        type: 'variable'
      }),
      children: /*#__PURE__*/_jsx("div", {
        className: "jflex-1",
        children: item.text
      })
    }, item.text);
  }
  function body_layout() {
    if (!selectedRule) {
      return null;
    }
    return /*#__PURE__*/_jsx("div", {
      className: "jflex-col jgap-3 jp-3 jflex-1 jofy-auto",
      children: variables.map((o, i) => item_layout(o, i))
    });
  }
  return /*#__PURE__*/_jsx(_Fragment, {
    children: body_layout()
  });
};
const DraggableRules = () => {
  const {
    rules,
    Drag
  } = useContext(CTX);
  function item_layout(rule, index) {
    return /*#__PURE__*/_jsxs("div", {
      className: "jflex-row jp-6 jbrd-c-5 jflex-row jalign-v",
      ...Drag.getDragAttrs({
        item: rule,
        type: 'rule'
      }),
      children: [/*#__PURE__*/_jsx("div", {
        className: "jflex-1",
        children: `${rule.name} - ${rule.id}`
      }), rule.active && /*#__PURE__*/_jsx("button", {
        className: "jfs-12 jbold",
        style: {
          color: 'green'
        },
        children: "active"
      })]
    }, rule.id);
  }
  function body_layout() {
    return /*#__PURE__*/_jsx("div", {
      className: "jflex-col jgap-3 jp-3 jflex-1 jofy-auto",
      children: rules.map((o, i) => item_layout(o, i))
    });
  }
  return /*#__PURE__*/_jsx(_Fragment, {
    children: body_layout()
  });
};
const Rule = () => {
  const {
    selectedRule,
    changeRule,
    generatePreview,
    mode
  } = useContext(CTX);
  const rule = selectedRule;
  const [tab, setTab] = useState(mode === 'edit' ? 'preview' : 'editor');
  function changeTab(tab) {
    if (tab === 'preview') {
      changeRule({
        finalCode: generatePreview()
      });
    }
    setTab(tab);
  }
  if (!selectedRule) {
    return null;
  }
  const options = [{
    text: 'Editor',
    value: 'editor',
    show: !rule.startDate
  }, {
    text: 'Preview And Save',
    value: 'preview'
  }, {
    text: 'Activation',
    value: 'activation'
  }, {
    text: 'Exacute',
    value: 'execute'
  }];
  return /*#__PURE__*/_jsxs("div", {
    className: "jflex-col theme2-border-left theme2-border-right jflex-1 jof-hidden",
    children: [/*#__PURE__*/_jsx(AITabs, {
      value: tab,
      onChange: tab => changeTab(tab),
      options: options
    }), /*#__PURE__*/_jsxs("div", {
      className: "jflex-col jflex-1 jp-12 jgap-3 jofy-auto jw-100",
      children: [tab === 'editor' && /*#__PURE__*/_jsx(RuleEditor, {}), tab === 'preview' && /*#__PURE__*/_jsx(RuleActions, {}), tab === 'activation' && /*#__PURE__*/_jsx(RuleActivation, {}), tab === 'execute' && /*#__PURE__*/_jsx(RuleExecute, {})]
    })]
  });
};
const RuleActivation = () => {
  const {
    apis,
    popup,
    selectedRule,
    errors,
    changeRule,
    selectRule
  } = useContext(CTX);
  const rule = selectedRule;
  const [startDate, setStartDate] = useState(rule.startDate || '');
  const [endDate, setEndDate] = useState(rule.endDate || '');
  const disabled = !!errors.length || typeof rule.startDate === 'string' || !!rule.active;
  const props = {
    jalali: true,
    size: 16,
    style: {
      border: '1px solid #565b5f',
      background: 'none',
      width: 160
    },
    disabled,
    popover: {
      position: 'center',
      setAttrs: key => {
        if (key === 'backdrop') {
          return {
            style: {
              background: 'rgba(0,0,0,0.5)'
            }
          };
        }
      }
    }
  };
  function activationModal(value) {
    if (!!value) {
      if (!startDate) {
        popup.addSnackebar({
          type: 'error',
          text: 'please inter start date'
        });
        return;
      }
    }
    popup.addConfirm({
      title: `${value ? 'Active' : 'Deactive'} Rule`,
      text: /*#__PURE__*/_jsxs("ul", {
        style: {
          listStyle: 'none'
        },
        className: "jp-0",
        children: [/*#__PURE__*/_jsx("li", {
          children: `Are you sure want to ${value ? 'Active' : 'Deactive'} ${selectedRule === null || selectedRule === void 0 ? void 0 : selectedRule.name}`
        }), /*#__PURE__*/_jsx("li", {
          children: `from date ${selectedRule === null || selectedRule === void 0 ? void 0 : selectedRule.startDate}`
        }), /*#__PURE__*/_jsx("li", {
          children: `to date ${selectedRule === null || selectedRule === void 0 ? void 0 : selectedRule.endDate}`
        })]
      }),
      onSubmit: async () => {
        if (value) {
          const res = await apis.activeRule(rule, startDate, endDate);
          if (res) {
            changeRule({
              active: value
            });
            selectRule(undefined);
            return true;
          }
          return false;
        } else {
          const res = await apis.deactiveRule(rule);
          if (res) {
            changeRule({
              active: value
            });
            selectRule(undefined);
            return true;
          }
          return false;
        }
      }
    });
  }
  function row_layout(label, input, error) {
    return /*#__PURE__*/_jsxs(_Fragment, {
      children: [/*#__PURE__*/_jsxs("div", {
        className: `jflex-row jalign-v jgap-12 jp-12 jm-b-3 jrelative rule-engine-form-row`,
        children: [/*#__PURE__*/_jsx("div", {
          className: "msf",
          children: label
        }), /*#__PURE__*/_jsx("div", {
          className: "jflex-1"
        }), /*#__PURE__*/_jsx("div", {
          className: "jw-fit",
          children: input
        })]
      }), !!error && /*#__PURE__*/_jsxs("div", {
        className: "rule-engine-activation-error",
        title: error,
        children: [/*#__PURE__*/_jsx(Icon, {
          path: mdiInformation,
          size: 0.6
        }), error]
      })]
    });
  }
  return /*#__PURE__*/_jsxs("div", {
    className: "jw-100 jrelative",
    children: [/*#__PURE__*/_jsx(InputRow, {
      label: "Start Date",
      error: !startDate ? 'Start date is required' : '',
      input: /*#__PURE__*/_jsx(AIDate, {
        ...props,
        value: startDate,
        onChange: startDate => setStartDate(startDate)
      })
    }), /*#__PURE__*/_jsx(InputRow, {
      label: "End Date",
      error: !endDate ? 'End date is required' : '',
      input: /*#__PURE__*/_jsx(AIDate, {
        ...props,
        value: endDate,
        onChange: endDate => setEndDate(endDate)
      })
    }), /*#__PURE__*/_jsx(InputRow, {
      label: "Activation",
      input: /*#__PURE__*/_jsx(AISwitch, {
        value: !!(selectedRule !== null && selectedRule !== void 0 && selectedRule.active),
        size: [24, 2, 3, 60],
        colors: ['#ddd', '#ef5644'],
        onChange: a => !errors.length ? activationModal(a) : undefined
      })
    }), !!errors.length && /*#__PURE__*/_jsxs("div", {
      className: "jfs-10 jflex-row jalign-v jgap-6",
      style: {
        color: 'red'
      },
      children: [/*#__PURE__*/_jsx(Icon, {
        path: mdiInformation,
        size: 0.6
      }), "You cannot active this rule, because there is ", /*#__PURE__*/_jsx("mark", {
        children: errors.length
      }), " syntax errors"]
    })]
  });
};
const RuleExecute = () => {
  const {
    selectedRule,
    apis
  } = useContext(CTX);
  const [model, setModel] = useState({});
  const [showKeys, setShowKeys] = useState({});
  const [result, setResult] = useState();
  async function execute() {
    if (!selectedRule) {
      return;
    }
    let fixedModel = {};
    for (let prop in model) {
      if (showKeys[prop] === true) {
        fixedModel[prop] = model[prop];
      }
    }
    const jsonString = JSON.stringify(fixedModel);
    const res = await apis.execute(selectedRule.id, jsonString);
    setResult(JSON.stringify(res, null, 4));
  }
  function json_layout() {
    const rows = [{
      key: 'weight',
      type: 'number',
      description: 'وزن(کیلوگرم)'
    }, {
      key: 'height',
      type: 'number',
      description: 'ارتفاع (سانتیمتر)'
    }, {
      key: 'width',
      type: 'number',
      description: 'عرض (سانتیمتر)'
    }, {
      key: 'length',
      type: 'number',
      description: 'طول (سانتیمتر)'
    }, {
      key: 'costOfGood',
      type: 'number',
      description: 'ارزش بسته (تومان)'
    }, {
      key: 'needToCod',
      type: 'radio',
      description: 'نیازمند دریافت هزینه',
      options: [{
        text: 'خیر',
        value: 0
      }, {
        text: 'بله',
        value: 1
      }]
    }, {
      key: 'needToPackage',
      type: 'radio',
      description: 'نیازمند بسته بندی',
      options: [{
        text: 'خیر',
        value: 0
      }, {
        text: 'بله',
        value: 1
      }]
    }, {
      key: 'needToPickup',
      type: 'radio',
      description: 'نیازمند جمع آوری',
      options: [{
        text: 'خیر',
        value: 0
      }, {
        text: 'بله',
        value: 1
      }]
    }, {
      key: 'paymentByReceiver',
      type: 'radio',
      description: 'پرداخت با گیرنده',
      options: [{
        text: 'خیر',
        value: 0
      }, {
        text: 'بله',
        value: 1
      }]
    }, {
      key: 'cdt',
      type: 'radio',
      description: 'رده جغرافیایی',
      options: [{
        text: 'درون شهری',
        value: 'INNER'
      }, {
        text: 'برون شهری',
        value: 'OUTER'
      }, {
        text: 'همجوار',
        value: 'CLOSER'
      }]
    }, {
      key: 'cct',
      type: 'radio',
      description: 'نوع بسته',
      options: [{
        text: 'اسناد',
        value: 'DOCUMENT'
      }, {
        text: 'بسته',
        value: 'PACKET'
      }]
    }, {
      key: 'company',
      type: 'text',
      description: 'نام شرکت'
    }, {
      key: 'hub',
      type: 'text',
      description: 'نام هاب'
    }, {
      key: 'companyGroup',
      type: 'text',
      description: 'گروه شرکتها'
    }, {
      key: 'timeCommitmentDuration',
      type: 'number',
      description: 'مدت ارایه خدمت (ساعت)'
    }, {
      key: 'timeCommitmentFrom',
      type: 'number',
      description: 'زمان ارایه خدمت (ساعت)'
    }, {
      key: 'countryDevision',
      type: 'text',
      description: 'شهر خاص'
    }, {
      key: 'fromCity',
      type: 'text',
      description: 'از شهر'
    }, {
      key: 'toCity',
      type: 'text',
      description: 'به شهر'
    }];
    return /*#__PURE__*/_jsx("div", {
      className: "jflex-col",
      children: rows.map(o => json_row_layout(o))
    });
  }
  function json_row_layout(p) {
    return /*#__PURE__*/_jsxs("div", {
      className: "jflex-row jgap-6 jalign-v jp-v-6 jbrd-c-14 jbrd-b",
      style: {
        opacity: showKeys[p.key] === true ? 1 : 0.4
      },
      children: [/*#__PURE__*/_jsx("div", {
        className: "msf",
        children: /*#__PURE__*/_jsx(AICheckbox, {
          className: "jbrd-none jw-180",
          text: p.key,
          subtext: p.description,
          value: showKeys[p.key] === true,
          onChange: v => {
            const newModel = {
              ...model,
              [p.key]: undefined
            };
            setModel(newModel);
            setResult(undefined);
            setShowKeys({
              ...showKeys,
              [p.key]: v
            });
          }
        })
      }), /*#__PURE__*/_jsx("div", {
        className: "msf",
        children: /*#__PURE__*/_jsx(AIOInput, {
          type: p.type,
          disabled: showKeys[p.key] !== true,
          value: model[p.key],
          options: p.options,
          onChange: v => {
            const newModel = {
              ...model,
              [p.key]: v
            };
            setResult(undefined);
            setModel(newModel);
          }
        })
      })]
    });
  }
  function code_layout() {
    const res = Code(JSON.stringify(model, null, 4));
    return res;
  }
  function response_layout() {
    if (!result) {
      return null;
    }
    return /*#__PURE__*/_jsxs("div", {
      className: "jflex-col",
      children: [/*#__PURE__*/_jsx("div", {
        className: "msf",
        children: "Response"
      }), /*#__PURE__*/_jsx("div", {
        className: "msf",
        children: Code(result)
      })]
    });
  }
  return /*#__PURE__*/_jsxs("div", {
    className: "flex-col",
    children: [json_layout(), code_layout(), response_layout(), /*#__PURE__*/_jsx("button", {
      className: "theme2-button-2",
      onClick: () => execute(),
      children: "Execute"
    })]
  });
};
const InputRow = ({
  label,
  input,
  error
}) => {
  return /*#__PURE__*/_jsxs(_Fragment, {
    children: [/*#__PURE__*/_jsxs("div", {
      className: `jflex-row jalign-v jgap-12 jp-12 jm-b-3 jrelative rule-engine-form-row`,
      children: [/*#__PURE__*/_jsx("div", {
        className: "jw-144",
        children: label
      }), input]
    }), !!error && /*#__PURE__*/_jsxs("div", {
      className: "rule-engine-activation-error",
      title: error,
      children: [/*#__PURE__*/_jsx(Icon, {
        path: mdiInformation,
        size: 0.6
      }), error]
    })]
  });
};
const RuleActions = () => {
  const {
    selectedRule,
    generatePreview,
    apis,
    addRule,
    selectRule,
    editRule,
    changeRule,
    mode,
    rules
  } = useContext(CTX);
  const rule = selectedRule;
  async function add() {
    const res = await addRule();
    if (res) {
      selectRule(undefined, undefined);
    }
  }
  async function edit() {
    const res = await editRule();
    if (res) {
      selectRule(undefined, undefined);
    }
  }
  const btnCLS = 'theme2-button-2 jh-48 jw-120  jfs-16';
  function save_layout() {
    if (mode !== 'add') {
      return null;
    }
    const disabled = !rule.description || typeof rule.priority !== 'number';
    return /*#__PURE__*/_jsx("button", {
      disabled: disabled,
      className: btnCLS,
      onClick: () => add(),
      children: "Save"
    });
  }
  function edit_layout() {
    if (mode !== 'edit') {
      return null;
    }
    const disabled = !rule.description || typeof rule.priority !== 'number';
    return /*#__PURE__*/_jsx("button", {
      disabled: disabled,
      className: btnCLS,
      onClick: () => edit(),
      children: "Save"
    });
  }
  function priority_layout() {
    return /*#__PURE__*/_jsx(InputRow, {
      label: "Priority",
      input: /*#__PURE__*/_jsx(AISlider, {
        start: 0,
        end: 12,
        className: "jflex-1 jbrd-none",
        value: rule.priority || 0,
        onChange: priority => changeRule({
          priority
        })
      })
    });
  }
  function description_layout() {
    return /*#__PURE__*/_jsx(InputRow, {
      label: "description",
      input: /*#__PURE__*/_jsx(AITextarea, {
        value: rule.description,
        className: "jflex-1",
        delay: 0,
        onChange: description => changeRule({
          description
        })
      }),
      error: !rule.description ? 'description is required' : undefined
    });
  }
  function category_layout() {
    return /*#__PURE__*/_jsx(InputRow, {
      label: "Category",
      input: /*#__PURE__*/_jsx(AIText, {
        validations: ['required'],
        value: selectedRule === null || selectedRule === void 0 ? void 0 : selectedRule.categoryName,
        className: "jflex-1",
        onChange: categoryName => changeRule({
          categoryName
        }),
        placeholder: "Inter rule category",
        showErrors: false
      }),
      error: !rule.categoryName ? 'categoryName is required' : undefined
    });
  }
  return /*#__PURE__*/_jsxs("div", {
    className: "",
    children: [Code(rule.finalCode || generatePreview()), /*#__PURE__*/_jsx(RuleErrors, {}), priority_layout(), description_layout(), category_layout(), save_layout(), edit_layout()]
  });
};
const RuleErrors = () => {
  const {
    errors
  } = useContext(CTX);
  function beautifyErrors(errors) {
    if (!errors || !errors.length) {
      return null;
    }
    const formattedErrors = errors.map((msg, index) => {
      const isLast = index === errors.length - 1;
      return /*#__PURE__*/_jsxs("li", {
        className: `jflex-row jc-4 jalign-v${!isLast ? ' jbrd-c-11 jbrd-b' : ''}`,
        style: {
          minHeight: 24
        },
        children: [/*#__PURE__*/_jsx("div", {
          className: "jw-24 jflex-row jalign-vh",
          children: /*#__PURE__*/_jsx(Icon, {
            path: mdiCloseCircle,
            size: 0.6,
            color: "#B95252"
          })
        }), /*#__PURE__*/_jsx("div", {
          className: "jflex-1",
          children: msg
        }), /*#__PURE__*/_jsx("span", {
          className: "jfs-12 jw-24 jalign-h-end jflex-row jm-r-12",
          style: {
            display: 'block'
          },
          children: index + 1
        })]
      }, index);
    });
    return /*#__PURE__*/_jsxs("ul", {
      style: {
        listStyle: 'none'
      },
      className: "jfs-12 jp-0 jc-14",
      children: [/*#__PURE__*/_jsxs("li", {
        className: "jflex-row jh-30 jalign-v jbrd-c-11 jbrd-b jm-b-6",
        children: [/*#__PURE__*/_jsx("div", {
          className: "jflex-1 jp-l-16 jc-10",
          children: "Issues"
        }), /*#__PURE__*/_jsx("div", {
          className: "jw-36 jflex-row jalign-vh jc-10",
          children: "#"
        })]
      }, 'titr'), formattedErrors]
    });
  }
  return beautifyErrors(errors);
};
const RuleEditor = props => {
  const {
    selectedTemplate,
    model,
    changeModelByField
  } = useContext(CTX);
  const template = props.template || selectedTemplate;
  const {
    rows
  } = template;
  function row_layout(row, rowIndex) {
    const {
      cells = []
    } = row;
    if (!cells.length) {
      return null;
    }
    return /*#__PURE__*/_jsx("div", {
      className: "jflex-row jalign-v",
      children: cells_layout(cells, rowIndex)
    });
  }
  function cells_layout(cells, rowIndex) {
    return /*#__PURE__*/_jsx("div", {
      className: "jflex-row jflex-1 jalign-v jgap-6 jh-100",
      children: cells.map((cell, cellIndex) => {
        return /*#__PURE__*/_jsx(CodeCell, {
          cell: cell,
          rowIndex: rowIndex,
          cellIndex: cellIndex,
          model: model,
          onChange: props.disabled ? undefined : (field, value) => changeModelByField(field, value)
        }, cellIndex);
      })
    });
  }
  return /*#__PURE__*/_jsx("div", {
    className: "rule-editor",
    children: rows.map((row, rowIndex) => row_layout(row, rowIndex))
  });
};
const CodeCell = ({
  cell,
  rowIndex,
  cellIndex,
  model,
  onChange
}) => {
  const {
    Drag,
    getFieldByIndex
  } = useContext(CTX);
  function select_layout(selectfield, options) {
    let value = model[selectfield];
    return /*#__PURE__*/_jsx(AIOInput, {
      type: "select",
      className: "jw-fit jbrd-none",
      options: options,
      value: value,
      onChange: !onChange ? undefined : newValue => onChange(selectfield, newValue),
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
      className: "jw-fit jbrd-none",
      value: model[field] || '',
      style: {
        minWidth: 96
      },
      onChange: !onChange ? undefined : newValue => onChange(field, newValue),
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
      className: "jflex-1 jbrd-none",
      inputAttrs: {
        className: 'resize-v'
      },
      value: model[field] || '',
      onChange: !onChange ? undefined : newValue => onChange(field, newValue),
      autoHighlight: false,
      validations: ['required'],
      lang: "en",
      showErrors: false
    });
  }
  const field = getFieldByIndex(rowIndex, cellIndex);
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
    className: "jflex-row jshrink-0",
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
      className: "msf jflex-row jalign-v jp-6 jalign-vh rule-engine-header jfs-14 jgap-6",
      style: {
        color: 'orange'
      },
      children: [/*#__PURE__*/_jsx(Icon, {
        path: mdiHistory,
        size: 0.8
      }), " ", trans('History')]
    });
  }
  function item_layout(historyItem) {
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
          className: "jfs-12 jflex-col",
          children: /*#__PURE__*/_jsx("div", {
            className: "jfs-12",
            children: historyItem.startDate
          })
        })]
      })
    });
  }
  function items_layout() {
    return /*#__PURE__*/_jsx("div", {
      className: "jflex-col jgap-3 jp-3 jflex-1 jofy-auto",
      children: history.reverse().map(o => item_layout(o))
    });
  }
  return /*#__PURE__*/_jsxs("div", {
    className: "jw-204 jflex-col jshrink-0 theme2-border-left",
    children: [header_layout(), " ", items_layout()]
  });
};
const Home = () => {
  const {
    templates,
    addTemplate,
    editTemplate,
    removeTemplate
  } = useContext(CTX);
  const [templateToEdit, setTemplateToEdit] = useState();
  const [templateToAdd, setTemplateToAdd] = useState(false);
  function rules_layout() {
    return /*#__PURE__*/_jsx(HomeRules, {});
  }
  function templates_layout() {
    return /*#__PURE__*/_jsx(AIPanel, {
      before: /*#__PURE__*/_jsx(Icon, {
        path: mdiFileCode,
        size: 1
      }),
      body: /*#__PURE__*/_jsx("div", {
        className: "jw-100 jflex-col jp-12 jgap-12",
        children: templates.map(template => {
          return /*#__PURE__*/_jsx(AICard, {
            text: template.name,
            onClick: () => setTemplateToEdit(template),
            after: /*#__PURE__*/_jsx("div", {
              className: "msf",
              onClick: () => {
                removeTemplate(template.id);
              },
              children: /*#__PURE__*/_jsx(Icon, {
                path: mdiClose,
                size: 1
              })
            })
          }, template.id);
        })
      }),
      text: "Templates",
      subtext: `${templates.length} items`,
      after: /*#__PURE__*/_jsx("div", {
        className: "jflex-row jalign-vh pointer",
        onClick: () => setTemplateToAdd(true),
        children: /*#__PURE__*/_jsx(Icon, {
          path: mdiPlusCircleOutline,
          size: 1.4
        })
      })
    });
  }
  if (templateToAdd) {
    return /*#__PURE__*/_jsx(Template, {
      onClose: () => setTemplateToAdd(false),
      mode: "add",
      onSubmit: async newTemplate => {
        const res = await addTemplate(newTemplate);
        if (res) {
          setTemplateToAdd(false);
        }
      }
    });
  }
  if (templateToEdit) {
    return /*#__PURE__*/_jsx(Template, {
      onClose: () => setTemplateToEdit(undefined),
      mode: "edit",
      template: templateToEdit,
      onSubmit: async newTemplate => {
        const res = await editTemplate(newTemplate);
        if (res) {
          setTemplateToEdit(undefined);
        }
      }
    });
  }
  return /*#__PURE__*/_jsxs("div", {
    className: "jflex-row jalign-h jflex-1 jp-12 jofy-auto jgap-12",
    children: [rules_layout(), " ", templates_layout()]
  });
};
const HomeRules = () => {
  const {
    popup,
    rules,
    selectRule,
    removeRule,
    cloneRule
  } = useContext(CTX);
  const [cat, setCat] = useState('All Rules');
  function getCats() {
    let cats = {
      'All Rules': [...rules]
    };
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const {
        categoryName
      } = rule;
      cats[categoryName] = cats[categoryName] || [];
      cats[categoryName].push(rule);
    }
    return cats;
  }
  function getBody() {
    const rules = cats[cat];
    return /*#__PURE__*/_jsx("div", {
      className: "jflex-col jgap-12",
      children: rules.map(rule => getEntityButton(rule))
    });
  }
  function getEntityButton(rule) {
    let subtextList = [rule.categoryName, `id:${rule.id}`, typeof rule.startDate === 'string' ? `${rule.startDate} - ${rule.endDate}` : 'deactive'];
    const subtext = /*#__PURE__*/_jsxs("div", {
      className: "jflex-row jgap-3 jp-v-6",
      children: [subtextList.map((o, index) => {
        return /*#__PURE__*/_jsx("div", {
          className: "jp-h-6 jbr-6 rule-engine-card-tag",
          children: o
        }, index);
      }), /*#__PURE__*/_jsx("div", {
        className: "jflex-1"
      }), rule.active && /*#__PURE__*/_jsx("div", {
        className: "jfs-12 jbold jp-h-6 jbr-4",
        style: {
          background: 'green'
        },
        children: "Active"
      })]
    });
    return /*#__PURE__*/_jsx(AICard, {
      subtext: subtext,
      onClick: () => selectRule(rule, 'edit'),
      text: /*#__PURE__*/_jsxs("div", {
        className: "jflex-row jalign-v jgap-6 theme2-bg1",
        children: [/*#__PURE__*/_jsx(Icon, {
          path: mdiFileCode,
          size: 0.8
        }), rule.name]
      }),
      after: /*#__PURE__*/_jsxs("div", {
        className: "jflex-row jgap-16",
        children: [/*#__PURE__*/_jsx("div", {
          className: "msf",
          onClick: () => cloneRule(rule),
          children: /*#__PURE__*/_jsx(Icon, {
            path: mdiContentCopy,
            size: 1
          })
        }), /*#__PURE__*/_jsx("div", {
          className: "msf",
          onClick: () => removeRule(rule.id),
          children: /*#__PURE__*/_jsx(Icon, {
            path: mdiClose,
            size: 1
          })
        })]
      })
    }, rule.id);
  }
  function addModal() {
    popup.addModal({
      header: {
        title: 'AddRule'
      },
      position: 'center',
      setAttrs: key => {
        if (key === 'backdrop') {
          return {
            className: 'jbf-4'
          };
        }
      },
      body: () => {
        return /*#__PURE__*/_jsx(AddRule, {
          categoryNames: Object.keys(cats).filter(o => o !== 'All Rules'),
          onSubmit: async (name, templateString, categoryName) => {
            const newRule = {
              categoryName,
              finalCode: '',
              template: templateString,
              name,
              model: {},
              active: false,
              id: 0,
              priority: 0,
              description: ''
            };
            selectRule(newRule, 'add');
            popup.removeModal();
          }
        });
      }
    });
  }
  function categoryButtons_layout() {
    return /*#__PURE__*/_jsx("div", {
      className: "",
      children: /*#__PURE__*/_jsx(AIButtons, {
        options: Object.keys(cats),
        value: cat,
        option: {
          text: 'option',
          value: 'option'
        },
        onChange: cat => setCat(cat)
      })
    });
  }
  const cats = getCats();
  return /*#__PURE__*/_jsx(AIPanel, {
    text: "Rules",
    subtext: `${rules.length} items`,
    after: /*#__PURE__*/_jsx("div", {
      className: "jflex-row jalign-vh pointer",
      onClick: () => addModal(),
      children: /*#__PURE__*/_jsx(Icon, {
        path: mdiPlusCircleOutline,
        size: 1.4
      })
    }),
    before: /*#__PURE__*/_jsx(Icon, {
      path: mdiFileCode,
      size: 1
    }),
    body: /*#__PURE__*/_jsxs("div", {
      className: "jflex-col jw-100",
      children: [/*#__PURE__*/_jsx("div", {
        className: "jp-h-12",
        children: categoryButtons_layout()
      }), /*#__PURE__*/_jsx("div", {
        className: "jflex-1 jp-12",
        children: getBody()
      })]
    })
  });
};
const AddRule = ({
  categoryNames,
  onSubmit
}) => {
  const {
    templates
  } = useContext(CTX);
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState();
  const [categoryName, setCategoryName] = useState('');
  const [errors, setErrors] = useState({});
  const disabled = !!Object.keys(errors).filter(o => !!errors[o].length).length;
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
      }),
      placeholder: "Inter rule name",
      showErrors: false
    }), /*#__PURE__*/_jsx("div", {
      className: "add-rule-label",
      children: "Rule Template"
    }), /*#__PURE__*/_jsx(AISelect, {
      options: templates,
      validations: ['required'],
      value: templateId,
      attrs: {
        tabIndex: 0
      },
      placeholder: "Select Template",
      subtext: templateId !== undefined ? templateId : undefined,
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
      }),
      showErrors: false
    }), /*#__PURE__*/_jsx("div", {
      className: "add-rule-label",
      children: "Rule Category"
    }), /*#__PURE__*/_jsx(AIText, {
      options: categoryNames,
      validations: ['required'],
      value: categoryName,
      option: {
        text: 'option',
        value: 'option',
        onClick: ({
          option
        }) => setCategoryName(option)
      },
      popover: {
        fitHorizontal: true
      },
      onChange: categoryName => setCategoryName(categoryName),
      reportError: error => setErrors({
        ...errors,
        categoryName: error
      }),
      placeholder: "Inter rule category",
      showErrors: false
    }), /*#__PURE__*/_jsx("div", {
      className: "msf"
    }), /*#__PURE__*/_jsx("button", {
      type: "button",
      className: "theme2-button-2",
      disabled: disabled,
      onClick: () => {
        const template = templates.find(o => o.id === templateId);
        if (!template) {
          return;
        }
        const templateString = JSON.stringify(template);
        onSubmit(name, templateString, categoryName);
      },
      children: "Add Rule"
    })]
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
  const [template, SetTemplate] = useState(getTemplate);
  function setTemplate(newTemplate) {
    SetTemplate(newTemplate);
    if (props.mode === 'add') {
      localStorage.setItem('boxitruleEngineAddTemplateRemember', JSON.stringify(newTemplate.rows));
    }
  }
  function getTemplate() {
    if (mode === 'edit') {
      return JSON.parse(JSON.stringify(props.template));
    }
    let storedRows = localStorage.getItem('boxitruleEngineAddTemplateRemember');
    if (storedRows === null) {
      storedRows = undefined;
    }
    let rows = [];
    if (storedRows) {
      try {
        rows = JSON.parse(storedRows);
      } catch {}
      if (!Array.isArray(rows)) {
        rows = [];
      }
    }
    return {
      id: GetRandomNumber(100000, 900000),
      name: '',
      rows
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
    const disabled = !template || !template.name || !template.rows || !template.rows.length;
    return /*#__PURE__*/_jsxs("div", {
      className: "theme2-bg-dark1 jp-h-24 jfs-14 jbold jflex-row jh-36 jalign-v jgap-6",
      children: [title, /*#__PURE__*/_jsx("div", {
        className: "jflex-1"
      }), /*#__PURE__*/_jsx("button", {
        onClick: () => props.onClose(),
        className: "theme2-button-3",
        children: "Close"
      }), /*#__PURE__*/_jsx("button", {
        disabled: disabled,
        onClick: () => props.onSubmit(template),
        className: "theme2-button-2",
        children: submitText
      })]
    });
  }
  function addFirstCell(type, rows) {
    let newRows = [];
    if (type === 'import') {
      newRows = [...(rows || [])];
    } else {
      newRows = [{
        cells: [getNewCellByType(type)]
      }];
    }
    setTemplate({
      ...template,
      rows: [...newRows]
    });
  }
  function editor_layout() {
    return /*#__PURE__*/_jsxs("div", {
      className: "jflex-1 jp-12 jh-100 jbg-d-10",
      children: [/*#__PURE__*/_jsx("div", {
        className: "jfs-16 jflex-row jalign-vh theme2-bg-dark1 jh-36",
        children: "Editor"
      }), /*#__PURE__*/_jsx("div", {
        className: "jflex-1 jofy-auto",
        children: /*#__PURE__*/_jsxs("div", {
          className: "jflex-col jp-12 jflex-1",
          children: [/*#__PURE__*/_jsx(AddTemplateCellButton, {
            onAdd: (v, rows) => addFirstCell(v, rows),
            isEmptyRow: true
          }), template.rows.map((o, rowIndex) => /*#__PURE__*/_jsx(TemplateRow, {
            row: o,
            rowIndex: rowIndex
          }, rowIndex))]
        })
      })]
    });
  }
  function preview_layout() {
    return /*#__PURE__*/_jsxs("div", {
      className: "jflex-1 jp-12 jh-100 jflex-col jbg-d-10",
      children: [/*#__PURE__*/_jsx("div", {
        className: "jfs-16 jflex-row jalign-vh theme2-bg-dark1 jh-36",
        children: "Preview"
      }), /*#__PURE__*/_jsx("div", {
        className: "jflex-1 jofy-auto jp-24 jgap-16 jflex-col",
        children: /*#__PURE__*/_jsx(RuleEditor, {
          template: template,
          disabled: true
        })
      })]
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
  function getNewCellByType(type) {
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
    return newCell;
  }
  function addCell(type, rowIndex, isEmptyRow, rows) {
    let newRows = [];
    if (type === 'import') {
      let tempRows = [];
      for (let i = 0; i < template.rows.length; i++) {
        if (i === rowIndex) {
          tempRows.push(template.rows[i]);
          tempRows = [...tempRows, ...(rows || [])];
        } else {
          tempRows.push(template.rows[i]);
        }
      }
      newRows = tempRows;
    } else {
      const newCell = getNewCellByType(type);
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
    }
    setTemplate({
      ...template,
      rows: newRows
    });
  }
  function addIndent(rowIndex) {
    let row = template.rows[rowIndex];
    if (!row) {
      return;
    }
    const newRow = {
      ...row,
      cells: ['indent', ...row.cells]
    };
    const newRows = template.rows.map((o, i) => i === rowIndex ? newRow : o);
    setTemplate({
      ...template,
      rows: newRows
    });
  }
  function removeIndent(rowIndex) {
    let row = template.rows[rowIndex];
    if (!row) {
      return;
    }
    if (row.cells[0] === 'indent') {
      const [, ...newCells] = row.cells;
      const newRow = {
        ...row,
        cells: newCells
      };
      const newRows = template.rows.map((o, i) => i === rowIndex ? newRow : o);
      setTemplate({
        ...template,
        rows: newRows
      });
    }
  }
  function importRows(rowIndex, newRows) {
    let tempRows = [];
    for (let i = 0; i < template.rows.length; i++) {
      if (i === rowIndex) {
        tempRows.push(template.rows[i]);
        tempRows = [...tempRows, ...newRows];
      } else {
        tempRows.push(template.rows[i]);
      }
    }
    newRows = tempRows;
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
      changeCell,
      importRows,
      addIndent,
      removeIndent
    };
  }
  return /*#__PURE__*/_jsx(TemplateContext.Provider, {
    value: getContext(),
    children: /*#__PURE__*/_jsxs("div", {
      className: "jh-100 jw-100 jofy-auto jflex-1 jflex-col jgap-12 jp-12",
      children: [header_layout(), /*#__PURE__*/_jsxs("div", {
        className: "jflex-col jbr-12",
        children: [/*#__PURE__*/_jsx("div", {
          className: "jm-b-6",
          children: "Template Name : "
        }), /*#__PURE__*/_jsx("div", {
          className: "jflex-1",
          children: /*#__PURE__*/_jsx(AIText, {
            value: template.name,
            onChange: name => setTemplate({
              ...template,
              name
            }),
            className: "jbrd-d-5"
          })
        })]
      }), /*#__PURE__*/_jsxs("div", {
        className: "jflex-col jflex-1 jbr-12",
        children: [/*#__PURE__*/_jsx("div", {
          className: "jm-b-6",
          children: "Template Body : "
        }), /*#__PURE__*/_jsxs("div", {
          className: "jflex-row jflex-1",
          children: [editor_layout(), preview_layout()]
        })]
      })]
    })
  });
};
const AddTemplateCellButton = ({
  onAdd,
  isEmptyRow
}) => {
  const {
    popup,
    templates
  } = useContext(CTX);
  const options = [{
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
    text: 'Import Template',
    value: 'import',
    show: !!isEmptyRow
  }];
  function importModal() {
    popup.addModal({
      position: 'center',
      header: {
        title: 'Import Template'
      },
      body: () => {
        if (!templates.length) {
          return /*#__PURE__*/_jsxs("div", {
            className: "jflex-row jalign-v jgap-6 jp-12",
            style: {
              color: 'orange'
            },
            children: [/*#__PURE__*/_jsx(Icon, {
              path: mdiAlert,
              size: 0.8
            }), "There is not any templates to import"]
          });
        }
        return /*#__PURE__*/_jsx("div", {
          className: "jflex-col",
          children: templates.map(o => {
            return /*#__PURE__*/_jsx("div", {
              className: "jp-12",
              onClick: () => {
                onAdd('import', o.rows);
                popup.removeModal();
              },
              children: o.name
            });
          })
        });
      }
    });
  }
  return /*#__PURE__*/_jsx(AISelect, {
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
    options: options,
    onChange: v => {
      if (v === 'import') {
        importModal();
      } else {
        onAdd(v);
      }
    },
    popover: {
      position: 'center'
    }
  });
};
const TemplateRow = ({
  row,
  rowIndex
}) => {
  const {
    removeCell,
    addCell,
    removeIndent,
    addIndent
  } = useContext(TemplateContext);
  function addCell_layout(rowIndex, isEmptyRow) {
    return /*#__PURE__*/_jsxs("div", {
      className: "jflex-row jalign-v",
      children: [/*#__PURE__*/_jsx("button", {
        className: "jbg-none jbrd-none jw-24 jh-24 jflex-row jalign-vh jp-0",
        style: {
          color: '#bbb',
          opacity: isEmptyRow ? 0 : 1
        },
        onClick: () => {
          if (!isEmptyRow) {
            removeIndent(rowIndex);
          }
        },
        children: /*#__PURE__*/_jsx(Icon, {
          path: mdiArrowCollapseLeft,
          size: 0.5
        })
      }), /*#__PURE__*/_jsx("button", {
        className: "jbg-none jbrd-none jw-24 jh-24 jflex-row jalign-vh jp-0",
        style: {
          color: '#bbb',
          opacity: isEmptyRow ? 0 : 1
        },
        onClick: () => {
          if (!isEmptyRow) {
            addIndent(rowIndex);
          }
        },
        children: /*#__PURE__*/_jsx(Icon, {
          path: mdiArrowCollapseRight,
          size: 0.5
        })
      }), /*#__PURE__*/_jsx("button", {
        type: "button",
        className: "jbg-none jbrd-none jw-24 jh-24 jflex-row jalign-vh jp-0",
        style: {
          color: 'orange',
          opacity: isEmptyRow ? 0 : 1
        },
        onClick: () => {
          if (!isEmptyRow) {
            removeCell(rowIndex);
          }
        },
        children: /*#__PURE__*/_jsx(Icon, {
          path: mdiDelete,
          size: 0.7
        })
      }), /*#__PURE__*/_jsx(AddTemplateCellButton, {
        onAdd: (v, rows) => addCell(v, rowIndex, isEmptyRow, rows),
        isEmptyRow: isEmptyRow
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
        return /*#__PURE__*/_jsx(SelectCellOptions, {
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
        className: "jp-h-6 jbr-4 theme2-bg-color1",
        children: "TextBox"
      });
    }
    if (cell.indexOf('textarea(') === 0) {
      return /*#__PURE__*/_jsx("div", {
        className: "jp-h-6 jbr-4 theme2-bg-color1",
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
      className: "jp-h-6 jbr-4 jrelative jpointer jflex-row jalign-v theme2-bg-color1",
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
    const width = cell.length * 5.4 + 16;
    return /*#__PURE__*/_jsx(AIText, {
      value: cell,
      style: {
        width
      },
      autoHighlight: false,
      className: "jp-h-0 jbr-4 jm-l-6 jbrd-none jh-24",
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
    className: "jw-1 jh-100 rule-engine-code-editor-indent"
  })
});
const SelectCellOptions = props => {
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
        className: "jflex-row jalign-v jp-h-12 jh-24 jbr-4 jm-jh-6 jbold jm-3",
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
        className: "jbrd-none jbr-4 jp-v-3 jp-h-12 jbold jfs-14 jc-4 jflex-row jalign-v jgap-6",
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
class apisClass {
  constructor(token, baseUrl) {
    _defineProperty(this, "request", void 0);
    _defineProperty(this, "baseUrl", 'http://boxi:40000/core-api/v1/');
    _defineProperty(this, "execute", async (ruleId, text) => {
      return await this.request({
        description: 'اجرای رول',
        method: 'post',
        url: `${this.baseUrl}rules/execute/eval/${ruleId}`,
        errorResult: [],
        body: {
          in: text
        },
        getResult: response => {
          return response.data.payload;
        }
      });
    });
    _defineProperty(this, "get_templates", async () => {
      //return this.mock_get_templates()
      return await this.request({
        description: 'دریافت لیست تمپلیت های رول انجین',
        method: 'get',
        url: `${this.baseUrl}rule-template/all`,
        errorResult: [],
        getResult: response => response.data.payload.map(o => ({
          id: o.id,
          name: o.name,
          rows: JSON.parse(o.ruleRows || '[]')
        }))
      });
    });
    _defineProperty(this, "add_template", async newTemplate => {
      return await this.request({
        description: 'افزودن تمپلیت رول انجین',
        method: 'post',
        url: `${this.baseUrl}rule-template/save`,
        body: {
          id: newTemplate.id,
          name: newTemplate.name,
          ruleRows: JSON.stringify(newTemplate.rows)
        },
        errorResult: false,
        getResult: response => response.data.payload.id
      });
    });
    _defineProperty(this, "edit_template", async newTemplate => {
      return await this.request({
        description: 'ویرایش تمپلیت رول انجین',
        method: 'post',
        url: `${this.baseUrl}rule-template/save`,
        body: {
          id: newTemplate.id,
          name: newTemplate.name,
          ruleRows: JSON.stringify(newTemplate.rows)
        },
        errorResult: false,
        getResult: () => true
      });
    });
    _defineProperty(this, "remove_template", async templateId => {
      return await this.request({
        description: 'حذف تمپلیت رول انجین',
        method: 'delete',
        url: `${this.baseUrl}rule-template/${templateId}`,
        errorResult: false,
        getResult: () => true
      });
    });
    _defineProperty(this, "get_rules", async () => {
      return await this.request({
        description: 'دریافت لیست رول های رول انجین',
        method: 'post',
        url: `${this.baseUrl}rules/filter`,
        errorResult: [],
        body: {},
        getResult: response => {
          return response.data.payload.map(o => {
            let model;
            try {
              model = JSON.parse(o.model);
            } catch {
              model = {};
            }
            return {
              id: o.id,
              name: o.name,
              priority: o.priority,
              categoryName: o.code,
              finalCode: o.content,
              startDate: o.activatedDate,
              endDate: o.finalDate,
              template: o.template,
              description: typeof o.description === 'string' ? o.description : '',
              model,
              active: o.isActive
            };
          });
        }
      });
    });
    _defineProperty(this, "add_rule", async newRule => {
      const body = {
        name: newRule.name,
        code: newRule.categoryName,
        content: newRule.finalCode,
        template: newRule.template,
        model: newRule.model,
        priority: newRule.priority,
        description: newRule.description
      };
      return await this.request({
        description: 'افزودن رول به رول انجین',
        method: 'post',
        url: `${this.baseUrl}rules/save`,
        body,
        errorResult: false,
        getResult: response => response.data.payload.id
      });
    });
    _defineProperty(this, "edit_rule", async newRule => {
      const body = {
        name: newRule.name,
        code: newRule.categoryName,
        content: newRule.finalCode,
        template: newRule.template,
        model: newRule.model,
        priority: newRule.priority
      };
      return await this.request({
        description: 'ویرایش رول در رول انجین',
        method: 'post',
        url: `${this.baseUrl}rules/update/${newRule.id}`,
        body,
        errorResult: false,
        getResult: response => response.status === 200
      });
    });
    _defineProperty(this, "remove_rule", async ruleId => {
      return await this.request({
        description: 'حذف رول رول انجین',
        method: 'delete',
        url: `${this.baseUrl}rules/${ruleId}`,
        errorResult: false,
        getResult: response => response.data.status === 'OK'
      });
    });
    _defineProperty(this, "history", async () => {
      return [];
    });
    _defineProperty(this, "activeRule", async (rule, startDate, endDate) => {
      const [ay, am, ad] = new AIODate().convertToArray(startDate);
      let body = {
        activateDate: {
          day: ad,
          month: am,
          year: ay
        }
      };
      if (endDate) {
        const [fy, fm, fd] = new AIODate().convertToArray(endDate);
        body.finalDate = {
          day: fd,
          month: fm,
          year: fy
        };
      }
      return await this.request({
        description: 'فعالسازی رول',
        method: 'post',
        url: `${this.baseUrl}rules/activeRule/${rule.id}`,
        errorResult: false,
        body,
        getResult: response => response.data.status === 'OK'
      });
    });
    _defineProperty(this, "deactiveRule", async rule => {
      return await this.request({
        description: 'غیر فعالسازی رول',
        method: 'post',
        url: `${this.baseUrl}rules/deActiveRule/${rule.id}`,
        errorResult: false,
        body: {},
        getResult: response => response.data.status === 'OK'
      });
    });
    _defineProperty(this, "validate", async code => {
      return await this.request({
        description: 'اعتبار سنجی رول',
        method: 'post',
        url: `${this.baseUrl}rules/checkSyntax`,
        errorResult: [],
        body: {
          in: code
        },
        getResult: response => {
          if (response.data.status === 'OK') {
            const list = response.data.payload || [];
            return response.data.payload.map(o => o.message);
          }
        }
      });
    });
    _defineProperty(this, "mock_get_templates", async () => {
      return [{
        "id": 1,
        "name": "temp1",
        "rows": [{
          "cells": ["import com.boxi.ruleEngine.dto.RuleFact;"]
        }, {
          "cells": ["rule \"", "text()", "\""]
        }, {
          "cells": ["indent", "no-loop", "select([\"false\",\"true\"])"]
        }, {
          "cells": ["indent", "lock-on-active", "select([\"false\",\"true\"])"]
        }, {
          "cells": ["indent", "when"]
        }, {
          "cells": ["indent", "indent", "ruleFact : RuleFact("]
        }, {
          "cells": ["indent", "indent", "indent", "textarea()"]
        }, {
          "cells": ["indent", "indent", ")"]
        }, {
          "cells": ["indent", "then"]
        }, {
          "cells": ["indent", "indent", "textarea()"]
        }, {
          "cells": ["end;"]
        }]
      }];
    });
    _defineProperty(this, "mock_get_rules", async () => {
      return [{
        "id": 62,
        "name": "myrule1",
        "categoryName": "topin",
        "finalCode": "-",
        "templateId": 1,
        "model": "{}",
        "startDate": undefined,
        "active": false
      }];
    });
    this.request = new AIOApis({
      id: 'boxitruleengine',
      token,
      lang: 'fa'
    }).request;
    this.baseUrl = baseUrl;
  }
}