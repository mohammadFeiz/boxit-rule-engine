import { FC } from "react";
import './index.css';
import './style.css';
import './theme3.css';
export type I_template = {
    id: number;
    rows: I_template_row[];
    name: string;
};
type I_template_row = {
    cells: I_template_cell[];
};
type I_template_cell = string;
type I_model = any;
export type I_rule = {
    model: I_model;
    finalCode: string;
    name: string;
    id: number;
    templateId: number;
    categoryName: string;
    startDate?: string;
    endDate?: string;
    active: boolean;
    isSaved?: boolean;
};
type I_variable = any;
type I_RuleEngine = {
    token: string;
    variables?: I_variable[];
    onExit: () => void;
    baseUrl: string;
};
declare const RuleEngine: FC<I_RuleEngine>;
export default RuleEngine;
