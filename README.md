# IPPS (Introductory Petroleum Production Software)

**IPPS** is a nascent, open-source project aimed at delivering a suite of petroleum engineering tools in a single platform. It is currently under development and contains several modules to assist with typical reservoir, well, and production engineering tasks.

## Overview

The current codebase you see here focuses on **Nodal Analysis** calculations, which help determine well performance given reservoir and wellbore constraints. Specifically, the existing implementation demonstrates how to:

1. **Enter reservoir and fluid properties** (permeability, thickness, viscosity, formation volume factor, etc.).
2. **Select a flow regime** (e.g., Transient, Pseudosteady-State, Steady-State).
3. **Compute an Inflow Performance Relationship (IPR)** for **liquid** wells under the chosen regime.

The program **converts user inputs** from various unit systems (e.g., Metric, Oil Field) into a canonical "Oil Field" standard before performing flow calculations. A front-end React interface collects these inputs, then draws IPR curves using Chart.js.

### Core Capabilities So Far

- **IPR Calculations for Liquid Phase**  
  - **Transient:** Uses a classic equation involving log of time and other parameters.  
  - **Pseudosteady-State:** Based on standard radial flow equations in a closed reservoir system.  
  - **Steady-State:** Ideal boundary conditions with constant pressure at the reservoir boundary.
- **Basic Unit Conversions**  
  - Permeability (mD vs. other units), length (ft vs. m), pressure (psi vs. bar), viscosity (cp vs. other), and time conversions (hr vs. s), plus partial handling of compressibility.
- **Front-End Form**  
  - Dynamically shows or hides relevant input fields depending on the chosen IPR Phase (Liquid, Gas, Two-phase) and Flow Regime.
- **Charting**  
  - Renders the IPR curve (with pressure vs. flow rate) using Chart.js.

### Next Steps (Roadmap)

1. **Complete IPR for Gas**  
   The liquid-phase formulas are largely implemented. However, the `calculateGasIPR` stub is present but not yet implemented. The next milestone will be to handle gas-dominated flow equations for typical reservoir/well conditions.

2. **OPR (Outflow Performance Relationship)**  
   After the IPR side is robust, we will build the **OPR** module. This will cover wellbore hydraulics, choke models, and vertical lift performance correlations. Once we have both **IPR** and **OPR**, we can fully conduct nodal analyses to determine optimum well conditions under a range of scenarios.

3. **Integrate More Unit Conversions**  
   We plan to expand the conversion library to handle any additional parameters we encounter. For instance, more advanced fluid property correlations or different user-specified measuring systems.

4. **Refine UI/UX**  
   - Add better **error handling** and validation for negative or zero input values.  
   - Provide **tooltips** or interactive explanations for each parameter.

5. **Integration with Other IPPS Modules**  
   - While **Nodal Analysis** is a significant module, the broader IPPS aims to handle tasks like decline-curve analysis, material balance, PVT calculations, etc. Future releases will incorporate these components into a single user interface.

## How to Run Locally

1. **Clone** the repository.
2. **Install** dependencies:
  npm install requirement.txt
3. **Start** the development server:
  npm run dev
4. **Open** the proper localhost url.