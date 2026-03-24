import { useMemo, useState } from "react";
import "./App.css";

const employees = [
  {
    id: "E-1001",
    name: "Jordan Smith",
    title: "Carpenter",
    jobFamily: "Craft Labor",
    businessGroup: "Field Operations",
    division: "North Alabama",
    manager: "Casey Brown",
    employeeStatus: "Active",
    isActiveEmployee: "Yes",
    effectiveTerminationDate: "None",
    currentLicense: "F1",
    requestedResponsibilityShift: false,
    exceptionId: "",
  },
  {
    id: "E-1002",
    name: "Taylor Brooks",
    title: "Foreman",
    jobFamily: "Field Supervision",
    businessGroup: "Field Operations",
    division: "Central Alabama",
    manager: "Jordan Blake",
    employeeStatus: "Active",
    isActiveEmployee: "Yes",
    effectiveTerminationDate: "None",
    currentLicense: "F1",
    requestedResponsibilityShift: true,
    exceptionId: "EX-001",
  },
  {
    id: "E-1003",
    name: "Morgan Lee",
    title: "Superintendent",
    jobFamily: "Field Supervision",
    businessGroup: "Field Operations",
    division: "Tennessee",
    manager: "Parker Dean",
    employeeStatus: "Active",
    isActiveEmployee: "Yes",
    effectiveTerminationDate: "None",
    currentLicense: "F3",
    requestedResponsibilityShift: false,
    exceptionId: "EX-002",
  },
  {
    id: "E-1004",
    name: "Avery Johnson",
    title: "Project Manager",
    jobFamily: "Project Management",
    businessGroup: "Operations",
    division: "Georgia",
    manager: "Jamie Stone",
    employeeStatus: "Active",
    isActiveEmployee: "Yes",
    effectiveTerminationDate: "None",
    currentLicense: "E5",
    requestedResponsibilityShift: false,
    exceptionId: "",
  },
];

const rules = [
  {
    ruleId: "LIC-001",
    decisionType: "License",
    ruleName: "Craft Labor default license",
    primaryDriver: "Job Family",
    supportingInputs: "Employee Status, Is Active Employee, Business Group",
    sourceValue: "Craft Labor",
    defaultOutcome: "F1",
    stableOrConfigurable: "Stable default",
    executionTarget: "Entra license assignment",
    exceptionAllowed: "Yes",
  },
  {
    ruleId: "LIC-002",
    decisionType: "License",
    ruleName: "Field Supervision default license",
    primaryDriver: "Job Family",
    supportingInputs: "Employee Status, Is Active Employee, Division",
    sourceValue: "Field Supervision",
    defaultOutcome: "F3",
    stableOrConfigurable: "Stable default",
    executionTarget: "Entra license assignment",
    exceptionAllowed: "Yes",
  },
  {
    ruleId: "LIC-003",
    decisionType: "License",
    ruleName: "Project Management default license",
    primaryDriver: "Job Family",
    supportingInputs: "Employee Status, Is Active Employee, Business Group",
    sourceValue: "Project Management",
    defaultOutcome: "E5",
    stableOrConfigurable: "Stable default",
    executionTarget: "Entra license assignment",
    exceptionAllowed: "Yes",
  },
  {
    ruleId: "DG-001",
    decisionType: "Distribution Group",
    ruleName: "Division-based DG membership",
    primaryDriver: "Division / org fields",
    supportingInputs: "Business Group, Employee Status, Manager / org context",
    sourceValue: "Current employee org attributes",
    defaultOutcome: "Build default DG membership set",
    stableOrConfigurable: "Configurable operating pattern",
    executionTarget: "Distribution-group maintenance path",
    exceptionAllowed: "Yes",
  },
];

const exceptions = [
  {
    exceptionId: "EX-001",
    linkedRule: "LIC-002",
    employee: "Taylor Brooks",
    type: "License override",
    overrideAction: "Assign E5 instead of F3",
    businessReason: "Business responsibility increased before official HR data caught up",
    owner: "Business owner / manager",
    reviewRequirement: "Required",
    status: "Active",
  },
  {
    exceptionId: "EX-002",
    linkedRule: "DG-001",
    employee: "Morgan Lee",
    type: "DG retention override",
    overrideAction: "Retain in alternate division communication group",
    businessReason: "Supports another division operationally",
    owner: "Business owner",
    reviewRequirement: "Recommended",
    status: "Active",
  },
];

const dgPopulation = [
  { name: "Jordan Smith", division: "North Alabama", defaultMatch: true, exceptionRetained: false },
  { name: "Taylor Brooks", division: "Central Alabama", defaultMatch: true, exceptionRetained: false },
  { name: "Morgan Lee", division: "Tennessee", defaultMatch: false, exceptionRetained: true },
  { name: "Avery Johnson", division: "Georgia", defaultMatch: false, exceptionRetained: false },
];

const auditTrail = [
  {
    timestamp: "2026-03-20 08:00",
    object: "Taylor Brooks",
    ruleId: "LIC-002",
    defaultOutput: "F3",
    exceptionApplied: "Yes",
    finalOutput: "E5",
    status: "Logged / reviewable",
  },
  {
    timestamp: "2026-03-20 18:00",
    object: "Central Alabama DG",
    ruleId: "DG-001",
    defaultOutput: "Default DG membership set",
    exceptionApplied: "Yes",
    finalOutput: "Merged final membership set",
    status: "Completed",
  },
  {
    timestamp: "2026-03-21 09:00",
    object: "Rule update proposal",
    ruleId: "LIC-002",
    defaultOutput: "F3 baseline retained",
    exceptionApplied: "No",
    finalOutput: "Version draft pending review",
    status: "Testing / not production",
  },
];

const ruleVersions = [
  {
    version: "v1",
    ruleId: "LIC-002",
    changeSummary: "Field Supervision defaults to F3",
    whyChanged: "Original stable default",
    rollback: "Available",
  },
  {
    version: "v2",
    ruleId: "LIC-002",
    changeSummary: "Exception handling separated from stable default",
    whyChanged: "Reduce brittle script logic and improve visibility",
    rollback: "Available",
  },
];

function getDefaultRule(employee) {
  return (
    rules.find(
      (rule) =>
        rule.decisionType === "License" &&
        rule.primaryDriver === "Job Family" &&
        rule.sourceValue === employee.jobFamily
    ) || null
  );
}

function getException(employee) {
  if (!employee.exceptionId) return null;
  return exceptions.find((ex) => ex.exceptionId === employee.exceptionId) || null;
}

function simulateDecision(employee, applyException) {
  const defaultRule = getDefaultRule(employee);
  const exception = getException(employee);

  const defaultOutcome = defaultRule ? defaultRule.defaultOutcome : "Review Needed";
  let finalOutcome = defaultOutcome;
  let decisionPath = "Default rule applied";
  let executionTarget = defaultRule ? defaultRule.executionTarget : "Review Needed";

  if (applyException && exception && exception.type === "License override") {
    finalOutcome = "E5";
    decisionPath = "Default rule applied, then exception overlay changed the final output";
  }

  return {
    defaultRule,
    exception: applyException ? exception : null,
    defaultOutcome,
    finalOutcome,
    decisionPath,
    executionTarget,
  };
}

export default function App() {
  const [tab, setTab] = useState("architecture");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("E-1002");
  const [applyException, setApplyException] = useState("yes");
  const [selectedDivision, setSelectedDivision] = useState("Central Alabama");

  const selectedEmployee =
    employees.find((e) => e.id === selectedEmployeeId) || employees[0];

  const result = useMemo(
    () => simulateDecision(selectedEmployee, applyException === "yes"),
    [selectedEmployee, applyException]
  );

  const dgResult = useMemo(() => {
    const defaultMembers = dgPopulation
      .filter((p) => p.division === selectedDivision && p.defaultMatch)
      .map((p) => p.name);

    const exceptionMembers = dgPopulation
      .filter((p) => p.exceptionRetained)
      .map((p) => p.name);

    return Array.from(new Set([...defaultMembers, ...exceptionMembers]));
  }, [selectedDivision]);

  return (
    <div className="app-shell">
      <div className="container">
        <h1>B&amp;G Future-State Blueprint Simulator</h1>
        <p className="intro">
          This proof of concept models a future-state operating structure using representative
          employee attributes aligned to the employeeinfo structure used by IT Security for
          Entra-related group membership. The goal is not to represent a final production
          system, but to make the redesign direction more concrete around employee-data inputs,
          default rules, exceptions, execution, and governance.
        </p>

        <div className="top-grid">
          <div className="card">
            <div className="small-label">What stays the same</div>
            <div className="metric-value">AD → Intraconnect → Entra path</div>
            <p className="intro">The working identity path remains intact.</p>
          </div>
          <div className="card">
            <div className="small-label">What improves</div>
            <div className="metric-value">Decision logic + visibility</div>
            <p className="intro">Rules and exceptions become easier to see and maintain.</p>
          </div>
          <div className="card">
            <div className="small-label">Input-layer anchor</div>
            <div className="metric-value">Employeeinfo structure</div>
            <p className="intro">Grounded in the employee-data structure used by IT Security for Entra-related group membership.</p>
          </div>
        </div>

        <div className="tabs">
          <button className={tab === "architecture" ? "active" : ""} onClick={() => setTab("architecture")}>
            1. Future-State Architecture
          </button>
          <button className={tab === "simulator" ? "active" : ""} onClick={() => setTab("simulator")}>
            2. Decision Simulator
          </button>
          <button className={tab === "rules" ? "active" : ""} onClick={() => setTab("rules")}>
            3. Rule Catalog
          </button>
          <button className={tab === "exceptions" ? "active" : ""} onClick={() => setTab("exceptions")}>
            4. Exception Registry
          </button>
          <button className={tab === "groups" ? "active" : ""} onClick={() => setTab("groups")}>
            5. DG Operating Model
          </button>
          <button className={tab === "governance" ? "active" : ""} onClick={() => setTab("governance")}>
            6. Governance
          </button>
          <button className={tab === "implementation" ? "active" : ""} onClick={() => setTab("implementation")}>
            7. Implementation Fit
          </button>
        </div>

        {tab === "architecture" && (
          <div className="two-col">
            <div className="card">
              <h3>Future-state operating layers</h3>
              <div className="flow-step">
                <strong>1. Employee-data input layer</strong><br />
                Modeled around the employeeinfo structure used by IT Security for Entra-related group membership, including fields such as job family, employee status, manager, org structure, effective termination date, and identity-related attributes.
              </div>
              <div className="flow-step">
                <strong>2. Default rule layer</strong><br />
                Stable default rules driven by employee-data inputs such as job family and supporting org fields.
              </div>
              <div className="flow-step">
                <strong>3. Exception layer</strong><br />
                Visible exception records that overlay the default when valid business need requires it.
              </div>
              <div className="flow-step">
                <strong>4. Execution layer</strong><br />
                Outcomes continue through the existing path. Identity and groups still move through AD → Intraconnect → Entra, and license movement lands at Entra.
              </div>
              <div className="flow-step">
                <strong>5. Governance layer</strong><br />
                Rule versions, logging, testing, rollback awareness, and review visibility make changes safer and easier to explain over time.
              </div>
            </div>

            <div className="card">
              <h3>Why this helps the redesign</h3>
              <div className="warn-box">
                <p><strong>Current pain:</strong> rules and exceptions are too embedded inside large scripts, which makes changes harder to maintain and explain.</p>
              </div>
              <div className="success-box">
                <p><strong>Future-state direction:</strong> the redesign preserves the working identity path but makes the employee-data layer, default rules, exception handling, and governance more visible and maintainable.</p>
              </div>
              <div className="outlined-box">
                <p><strong>Databricks direction:</strong> this input layer reflects the directional move toward a Databricks-backed employee-info structure supporting downstream Entra-related group membership and identity decisions.</p>
              </div>
            </div>
          </div>
        )}

        {tab === "simulator" && (
          <div className="two-col">
            <div className="card">
              <h3>Decision simulator</h3>

              <label>Employee scenario</label>
              <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.title}
                  </option>
                ))}
              </select>

              <label>Apply exception overlay?</label>
              <select value={applyException} onChange={(e) => setApplyException(e.target.value)}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>

              <div className="soft-box">
                <p><strong>Job Family:</strong> {selectedEmployee.jobFamily}</p>
                <p><strong>Business Group:</strong> {selectedEmployee.businessGroup}</p>
                <p><strong>Division:</strong> {selectedEmployee.division}</p>
                <p><strong>Manager:</strong> {selectedEmployee.manager}</p>
                <p><strong>Employee Status:</strong> {selectedEmployee.employeeStatus}</p>
                <p><strong>Is Active Employee:</strong> {selectedEmployee.isActiveEmployee}</p>
                <p><strong>Effective Termination Date:</strong> {selectedEmployee.effectiveTerminationDate}</p>
                <p><strong>Current License:</strong> {selectedEmployee.currentLicense}</p>
              </div>
            </div>

            <div className="card">
              <h3>Decision walkthrough</h3>
              <div className="flow-step">
                <strong>Step 1 — Read attributes</strong><br />
                Representative employee attributes aligned to the employeeinfo structure are evaluated as the input layer.
              </div>
              <div className="flow-step">
                <strong>Step 2 — Apply default rule</strong><br />
                Default rule: {result.defaultRule ? result.defaultRule.ruleId : "Review Needed"} → {result.defaultOutcome}
              </div>
              <div className="flow-step">
                <strong>Step 3 — Check exception overlay</strong><br />
                {result.exception ? `${result.exception.exceptionId} applies because ${result.exception.businessReason}.` : "No active exception applied."}
              </div>
              <div className="flow-step">
                <strong>Step 4 — Final outcome</strong><br />
                Final output: {result.finalOutcome} at {result.executionTarget}
              </div>

              <div className="outlined-box">
                <p><strong>Decision path:</strong> {result.decisionPath}</p>
                <p><strong>Why this matters:</strong> this makes the future-state decision flow easier to review and react to than static diagrams alone.</p>
              </div>
            </div>
          </div>
        )}

        {tab === "rules" && (
          <div className="card">
            <h3>Rule catalog</h3>
            <p className="intro">
              This catalog shows how future-state rules could be represented more clearly than embedded script logic. The purpose is to evaluate stable defaults using employee attributes already relevant to downstream identity and group decisions, while keeping exception handling more visible and reviewable.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Rule ID</th>
                  <th>Decision Type</th>
                  <th>Primary Driver</th>
                  <th>Supporting Inputs</th>
                  <th>Default Outcome</th>
                  <th>Stable / Configurable</th>
                  <th>Execution Target</th>
                  <th>Exception Allowed?</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.ruleId}>
                    <td>{rule.ruleId}</td>
                    <td>{rule.decisionType}</td>
                    <td>{rule.primaryDriver}</td>
                    <td>{rule.supportingInputs}</td>
                    <td>{rule.defaultOutcome}</td>
                    <td>{rule.stableOrConfigurable}</td>
                    <td>{rule.executionTarget}</td>
                    <td>{rule.exceptionAllowed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "exceptions" && (
          <div className="card">
            <h3>Exception registry</h3>
            <p className="intro">
              The purpose of this structure is to make exceptions visible and maintainable instead of embedding them invisibly inside large script logic.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Exception ID</th>
                  <th>Linked Rule</th>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Override Action</th>
                  <th>Business Reason</th>
                  <th>Owner</th>
                  <th>Review</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {exceptions.map((ex) => (
                  <tr key={ex.exceptionId}>
                    <td>{ex.exceptionId}</td>
                    <td>{ex.linkedRule}</td>
                    <td>{ex.employee}</td>
                    <td>{ex.type}</td>
                    <td>{ex.overrideAction}</td>
                    <td>{ex.businessReason}</td>
                    <td>{ex.owner}</td>
                    <td>{ex.reviewRequirement}</td>
                    <td>{ex.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="outlined-box">
              <p><strong>Design note:</strong> this demonstrates a future-state exception structure, not a finalized production workflow.</p>
            </div>
          </div>
        )}

        {tab === "groups" && (
          <div className="two-col">
            <div className="card">
              <h3>Distribution-group operating model</h3>

              <label>Choose division view</label>
              <select value={selectedDivision} onChange={(e) => setSelectedDivision(e.target.value)}>
                <option value="Central Alabama">Central Alabama</option>
                <option value="North Alabama">North Alabama</option>
                <option value="Tennessee">Tennessee</option>
              </select>

              <div className="flow-step">
                <strong>1. Pull employee-data inputs</strong><br />
                Evaluate employeeinfo-derived org and employee attributes relevant to downstream Entra-related group maintenance.
              </div>
              <div className="flow-step">
                <strong>2. Build default DG set</strong><br />
                Use current division / org logic to create the default membership set.
              </div>
              <div className="flow-step">
                <strong>3. Apply exception overlay</strong><br />
                Merge approved retained members through the exception overlay.
              </div>
              <div className="flow-step">
                <strong>4. End-of-day repopulate</strong><br />
                Empty and repopulate the DG using the merged final set.
              </div>

              <div className="warn-box">
                <p><strong>Boundary note:</strong> this future-state pattern is strongest for distribution groups. It uses current employee-data inputs to rebuild the default membership set and then merges approved retained members through the exception overlay.</p>
              </div>
            </div>

            <div className="card">
              <h3>Simulated final DG membership</h3>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Division</th>
                    <th>Default Match?</th>
                    <th>Exception Retained?</th>
                  </tr>
                </thead>
                <tbody>
                  {dgPopulation.map((p) => (
                    <tr key={p.name}>
                      <td>{p.name}</td>
                      <td>{p.division}</td>
                      <td>{p.defaultMatch ? "Yes" : "No"}</td>
                      <td>{p.exceptionRetained ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="outlined-box">
                <p><strong>Final member set after repopulation:</strong></p>
                <div className="badge-wrap">
                  {dgResult.map((name) => (
                    <span className="pill" key={name}>{name}</span>
                  ))}
                </div>
              </div>

              <div className="success-box">
                <p><strong>Why this helps:</strong> members who no longer match the default rule fall out automatically unless intentionally retained through exception handling, which helps reduce stale communication-group membership over time.</p>
              </div>
            </div>
          </div>
        )}

        {tab === "governance" && (
          <div className="two-col">
            <div className="card">
              <h3>Audit / decision trail</h3>
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Object</th>
                    <th>Rule ID</th>
                    <th>Default Output</th>
                    <th>Exception?</th>
                    <th>Final Output</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {auditTrail.map((row, i) => (
                    <tr key={i}>
                      <td>{row.timestamp}</td>
                      <td>{row.object}</td>
                      <td>{row.ruleId}</td>
                      <td>{row.defaultOutput}</td>
                      <td>{row.exceptionApplied}</td>
                      <td>{row.finalOutput}</td>
                      <td>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <h3>Rule versioning / rollback view</h3>
              <table>
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Rule ID</th>
                    <th>Change Summary</th>
                    <th>Why Changed</th>
                    <th>Rollback</th>
                  </tr>
                </thead>
                <tbody>
                  {ruleVersions.map((row, i) => (
                    <tr key={i}>
                      <td>{row.version}</td>
                      <td>{row.ruleId}</td>
                      <td>{row.changeSummary}</td>
                      <td>{row.whyChanged}</td>
                      <td>{row.rollback}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="soft-box">
                <p><strong>Why this matters:</strong> because the current environment relies heavily on embedded script logic, the future state needs more visible rule changes, clearer exception handling, and safer change control through logging, versioning, testing, and rollback awareness.</p>
              </div>
            </div>
          </div>
        )}

        {tab === "implementation" && (
          <div className="two-col">
            <div className="card">
              <h3>What stays stable</h3>
              <div className="soft-box">
                <ul>
                  <li>The working identity path through AD → Intraconnect → Entra</li>
                  <li>Practical scheduled operations where they still make sense</li>
                  <li>Some stable defaults that do not need constant change</li>
                </ul>
              </div>

              <h3>What becomes more maintainable</h3>
              <div className="success-box">
                <ul>
                  <li>Employee-data inputs become easier to reason about</li>
                  <li>Default rules become easier to explain</li>
                  <li>Exceptions become visible instead of buried</li>
                  <li>DG handling becomes cleaner over time</li>
                  <li>Change control becomes easier to review and document</li>
                </ul>
              </div>
            </div>

            <div className="card">
              <h3>What stays controlled/manual</h3>
              <div className="warn-box">
                <ul>
                  <li>Name changes and other higher-risk identity changes</li>
                  <li>Sensitive access scenarios that should not be treated like low-risk automation</li>
                  <li>Design areas where broader future-state behavior has not been fully validated yet</li>
                </ul>
              </div>

              <div className="outlined-box">
                <p><strong>Implementation framing:</strong> this redesign is meant to be phased modernization of a working environment. It preserves the current identity path while improving the parts of the environment that are hardest to maintain over time.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}