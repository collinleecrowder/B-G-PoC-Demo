import { useMemo, useState } from "react";
import "./App.css";

const employees = [
  {
    id: "E-1001",
    name: "Jordan Smith",
    title: "Carpenter",
    jobFamily: "Craft Labor",
    division: "North Alabama",
    department: "Field Operations",
    status: "Active",
    currentLicense: "F1",
    currentPath: "AD -> Entra",
    requestedResponsibilityShift: false,
    exceptionId: "",
  },
  {
    id: "E-1002",
    name: "Taylor Brooks",
    title: "Foreman",
    jobFamily: "Field Supervision",
    division: "Central Alabama",
    department: "Field Operations",
    status: "Active",
    currentLicense: "F1",
    currentPath: "AD -> Entra",
    requestedResponsibilityShift: true,
    exceptionId: "EX-001",
  },
  {
    id: "E-1003",
    name: "Morgan Lee",
    title: "Superintendent",
    jobFamily: "Field Supervision",
    division: "Tennessee",
    department: "Field Operations",
    status: "Active",
    currentLicense: "F3",
    currentPath: "AD -> Entra",
    requestedResponsibilityShift: false,
    exceptionId: "EX-002",
  },
  {
    id: "E-1004",
    name: "Avery Johnson",
    title: "Project Manager",
    jobFamily: "Project Management",
    division: "Georgia",
    department: "Operations",
    status: "Active",
    currentLicense: "E5",
    currentPath: "AD -> Entra",
    requestedResponsibilityShift: false,
    exceptionId: "",
  },
];

const rules = [
  {
    ruleId: "LIC-001",
    decisionType: "License",
    ruleName: "Craft Labor default license",
    sourceDriver: "Job Family",
    sourceValue: "Craft Labor",
    stableOrConfigurable: "Stable default",
    defaultOutcome: "F1",
    executionLayer: "Entra",
    exceptionAllowed: "Yes",
    owner: "Business-backed / IT-operated",
    reviewNeeded: "If changed",
  },
  {
    ruleId: "LIC-002",
    decisionType: "License",
    ruleName: "Field Supervision default license",
    sourceDriver: "Job Family",
    sourceValue: "Field Supervision",
    stableOrConfigurable: "Stable default",
    defaultOutcome: "F3",
    executionLayer: "Entra",
    exceptionAllowed: "Yes",
    owner: "Business-backed / IT-operated",
    reviewNeeded: "If changed",
  },
  {
    ruleId: "LIC-003",
    decisionType: "License",
    ruleName: "Project Management default license",
    sourceDriver: "Job Family",
    sourceValue: "Project Management",
    stableOrConfigurable: "Stable default",
    defaultOutcome: "E5",
    executionLayer: "Entra",
    exceptionAllowed: "Yes",
    owner: "Business-backed / IT-operated",
    reviewNeeded: "If changed",
  },
  {
    ruleId: "DG-001",
    decisionType: "Distribution Group",
    ruleName: "Division-based DG membership",
    sourceDriver: "Division",
    sourceValue: "Current employee division",
    stableOrConfigurable: "Configurable pattern",
    defaultOutcome: "Add to default DG set",
    executionLayer: "AD/Entra downstream group maintenance",
    exceptionAllowed: "Yes",
    owner: "Business-backed / IT-operated",
    reviewNeeded: "Periodic",
  },
];

const exceptions = [
  {
    exceptionId: "EX-001",
    linkedRule: "LIC-002",
    employee: "Taylor Brooks",
    type: "License override",
    overrideAction: "Assign E5 instead of F3",
    reason: "Business responsibility increased before official HR update",
    owner: "Business owner / manager",
    review: "Required",
    status: "Active",
  },
  {
    exceptionId: "EX-002",
    linkedRule: "DG-001",
    employee: "Morgan Lee",
    type: "DG retention override",
    overrideAction: "Retain in alternate division communication group",
    reason: "Supports another division operationally",
    owner: "Business owner",
    review: "Recommended",
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
    decisionType: "License",
    ruleId: "LIC-002",
    defaultOutput: "F3",
    exceptionApplied: "Yes",
    finalOutput: "E5",
    executionLayer: "Entra",
    status: "Logged / reviewable",
  },
  {
    timestamp: "2026-03-20 18:00",
    object: "Central Alabama DG",
    decisionType: "Distribution Group",
    ruleId: "DG-001",
    defaultOutput: "Default membership set",
    exceptionApplied: "Yes",
    finalOutput: "Merged set after repopulation",
    executionLayer: "DG maintenance path",
    status: "Completed",
  },
  {
    timestamp: "2026-03-21 09:00",
    object: "Rule update proposal",
    decisionType: "Governance",
    ruleId: "LIC-002",
    defaultOutput: "F3 retained",
    exceptionApplied: "No",
    finalOutput: "Version draft pending review",
    executionLayer: "Governance layer",
    status: "Testing / not production",
  },
];

const ruleVersions = [
  {
    version: "v1",
    ruleId: "LIC-002",
    changeSummary: "Field Supervision defaults to F3",
    whyChanged: "Original baseline rule",
    rollback: "Available",
    testStatus: "Validated baseline",
  },
  {
    version: "v2",
    ruleId: "LIC-002",
    changeSummary: "Exception handling separated from stable default",
    whyChanged: "Reduce brittle script logic and improve visibility",
    rollback: "Available",
    testStatus: "Conceptual review state",
  },
];

function getDefaultRule(employee) {
  return (
    rules.find(
      (rule) =>
        rule.decisionType === "License" &&
        rule.sourceDriver === "Job Family" &&
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
  let executionLayer = defaultRule ? defaultRule.executionLayer : "Review Needed";

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
    executionLayer,
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
          This proof of concept is designed as a future-state operating model simulator.
          It preserves the working identity path, but shows how default decision logic,
          exception handling, distribution-group maintenance, and governance could be
          structured more cleanly and maintained more effectively over time.
        </p>

        <div className="top-grid">
          <div className="card">
            <div className="small-label">What stays the same</div>
            <div className="metric-value">AD → Intraconnect → Entra path</div>
            <p className="intro">The identity path remains intact.</p>
          </div>
          <div className="card">
            <div className="small-label">What improves</div>
            <div className="metric-value">Decision logic + exception visibility</div>
            <p className="intro">Rules become easier to explain and maintain.</p>
          </div>
          <div className="card">
            <div className="small-label">Main redesign goal</div>
            <div className="metric-value">Business-backed maintainability</div>
            <p className="intro">Not cleaner code for its own sake — cleaner operating logic.</p>
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
                <strong>1. Employee data inputs</strong><br />
                SuccessFactors-driven attributes, directionally through the Databricks-fed employee-data model.
              </div>
              <div className="flow-step">
                <strong>2. Default rule layer</strong><br />
                Stable default rules driven by job family and supporting org fields.
              </div>
              <div className="flow-step">
                <strong>3. Exception layer</strong><br />
                Visible exception records that overlay the default when business need requires it.
              </div>
              <div className="flow-step">
                <strong>4. Execution layer</strong><br />
                Identity and group outcomes continue through the working AD → Intraconnect → Entra path. License movement lands at Entra.
              </div>
              <div className="flow-step">
                <strong>5. Governance layer</strong><br />
                Rule versions, testing, rollback, and auditability make changes safer and easier to review.
              </div>
            </div>

            <div className="card">
              <h3>What this architecture changes</h3>
              <div className="warn-box">
                <p><strong>Current pain:</strong> rules and exceptions are too buried inside large scripts, which makes change harder to explain and maintain.</p>
              </div>
              <div className="success-box">
                <p><strong>Future-state direction:</strong> defaults remain stable, exceptions become visible, and the decision structure becomes easier to govern without replacing the whole environment.</p>
              </div>
              <div className="outlined-box">
                <p><strong>Design guardrail:</strong> this is phased modernization of a working environment, not a rip-and-replace solution.</p>
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
                <p><strong>Job family:</strong> {selectedEmployee.jobFamily}</p>
                <p><strong>Division:</strong> {selectedEmployee.division}</p>
                <p><strong>Status:</strong> {selectedEmployee.status}</p>
                <p><strong>Current license:</strong> {selectedEmployee.currentLicense}</p>
              </div>
            </div>

            <div className="card">
              <h3>Decision walkthrough</h3>
              <div className="flow-step">
                <strong>Step 1 — Read attributes</strong><br />
                Job family and org context are pulled from the employee-data layer.
              </div>
              <div className="flow-step">
                <strong>Step 2 — Apply default rule</strong><br />
                Default rule: {result.defaultRule ? result.defaultRule.ruleId : "Review Needed"} → {result.defaultOutcome}
              </div>
              <div className="flow-step">
                <strong>Step 3 — Check exception overlay</strong><br />
                {result.exception ? `${result.exception.exceptionId} applies because ${result.exception.reason}.` : "No active exception applied."}
              </div>
              <div className="flow-step">
                <strong>Step 4 — Final outcome</strong><br />
                Final output: {result.finalOutcome} at {result.executionLayer}
              </div>

              <div className="outlined-box">
                <p><strong>Decision path:</strong> {result.decisionPath}</p>
              </div>
            </div>
          </div>
        )}

        {tab === "rules" && (
          <div className="card">
            <h3>Rule catalog</h3>
            <p className="intro">
              This catalog shows how future-state rules could be represented more clearly than buried script logic.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Rule ID</th>
                  <th>Decision Type</th>
                  <th>Driver</th>
                  <th>Source Value</th>
                  <th>Default Outcome</th>
                  <th>Stable / Configurable</th>
                  <th>Execution Layer</th>
                  <th>Exception Allowed?</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.ruleId}>
                    <td>{rule.ruleId}</td>
                    <td>{rule.decisionType}</td>
                    <td>{rule.sourceDriver}</td>
                    <td>{rule.sourceValue}</td>
                    <td>{rule.defaultOutcome}</td>
                    <td>{rule.stableOrConfigurable}</td>
                    <td>{rule.executionLayer}</td>
                    <td>{rule.exceptionAllowed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="soft-box">
              <p><strong>Why this matters</strong></p>
              <p>
                The point is not that every rule becomes fully dynamic. The point is that stable defaults stay understandable,
                while change-prone business logic becomes easier to maintain and review.
              </p>
            </div>
          </div>
        )}

        {tab === "exceptions" && (
          <div className="card">
            <h3>Exception registry</h3>
            <p className="intro">
              Exceptions should stop living invisibly inside giant scripts. This registry makes them visible, explainable, and reviewable.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Exception ID</th>
                  <th>Linked Rule</th>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Override Action</th>
                  <th>Reason</th>
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
                    <td>{ex.reason}</td>
                    <td>{ex.owner}</td>
                    <td>{ex.review}</td>
                    <td>{ex.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="outlined-box">
              <p><strong>Important:</strong> this demonstrates a future-state structure, not a final approved production workflow.</p>
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
                <strong>1. Pull employee data</strong><br />
                Evaluate current employee attributes from the SuccessFactors / Databricks-fed model.
              </div>
              <div className="flow-step">
                <strong>2. Build default DG set</strong><br />
                Use current division / org logic to create the default membership set.
              </div>
              <div className="flow-step">
                <strong>3. Apply exception overlay</strong><br />
                Merge approved retained members through the exception group overlay.
              </div>
              <div className="flow-step">
                <strong>4. End-of-day repopulate</strong><br />
                Empty and repopulate the DG using the merged final set.
              </div>

              <div className="warn-box">
                <p><strong>Boundary note:</strong> this pattern is strongest for distribution groups only. Security groups remain a separate design case.</p>
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
                <p><strong>Why this helps operations</strong></p>
                <p>
                  Members who no longer meet the default rule fall out automatically unless intentionally retained through exception handling,
                  which helps reduce stale group membership without event-driven complexity.
                </p>
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
                    <th>Decision Type</th>
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
                      <td>{row.decisionType}</td>
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
                    <th>Test Status</th>
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
                      <td>{row.testStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="soft-box">
                <p><strong>Why this matters</strong></p>
                <p>
                  The future state should make rule changes easier to test, easier to review, and easier to reverse without relying on opaque script edits.
                </p>
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
                  <li>The working identity execution path through AD → Intraconnect → Entra</li>
                  <li>Practical scheduled operations where they still make sense</li>
                  <li>Some stable defaults that do not change often</li>
                </ul>
              </div>

              <h3>What becomes more maintainable</h3>
              <div className="success-box">
                <ul>
                  <li>Default decision logic becomes easier to explain</li>
                  <li>Exceptions become visible and separate from defaults</li>
                  <li>DG handling becomes cleaner and less stale over time</li>
                  <li>Change control becomes easier to review and log</li>
                </ul>
              </div>
            </div>

            <div className="card">
              <h3>What stays controlled/manual</h3>
              <div className="warn-box">
                <ul>
                  <li>Name changes and other higher-risk identity changes</li>
                  <li>Sensitive access scenarios that should not be treated like low-risk automation</li>
                  <li>Design areas where B&amp;G has not validated a broader future-state pattern</li>
                </ul>
              </div>

              <div className="outlined-box">
                <p><strong>Implementation framing</strong></p>
                <p>
                  This redesign is meant to be phased modernization of a working environment. It improves the areas that are hardest to maintain
                  without requiring a full replacement platform.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}