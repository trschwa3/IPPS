# IPPS (Introductory Petroleum Production Software)

**IPPS** is an open-source project aimed at providing a suite of petroleum engineering tools in a single platform. Although still under development, it already offers several modules for reservoir, well, and production engineering tasks.

## Overview

This portion of the codebase primarily focuses on **Nodal Analysis** calculations, enabling users to determine well performance based on reservoir and wellbore constraints. The application features a React front end that gathers inputs for both **liquid** and **gas** reservoir scenarios, then computes and displays an **Inflow Performance Relationship (IPR)** curve.

### Recent Updates
- **Gas Phase Handling**  
  - Users can now select “Gas” as the IPR phase.  
  - Relevant gas properties (e.g., specific gravity, reservoir temperature) are validated via min/max constraints.  
  - Pseudosteady‐state, steady‐state, and transient formulas are partially implemented for gas IPR.
- **Field-by-Field Validation**  
  - Each numeric field enforces custom min/max rules in JavaScript (React) with immediate error messaging (e.g., “Must be at least 500 psi”).
  - HTML attributes `min`/`max` remain for user convenience with numeric spinners.

### Core Capabilities

1. **IPR Calculations for Liquid**  
   - **Transient:** Uses standard log‐time radial flow equations.  
   - **Pseudosteady‐State:** Based on closed‐reservoir assumptions and radial flow.  
   - **Steady‐State:** Ideal open‐boundary solution with constant boundary pressure.

2. **(Work‐in‐Progress) IPR Calculations for Gas**  
   - Basic structure for transient, pseudosteady‐state, and steady‐state gas flow.  
   - Integrates user inputs (permeability, thickness, skin, etc.) with partial real‐gas `z` correlations (Dranchuk & Abou-Kassem, Dranchuk, Purvis & Robinson, Redlich Kwong, Brill & Beggs).  
   - Additional validation rules to ensure reservoir temperature is within 100–350 °F, etc.

3. **Front-End Forms**  
   - Dynamically shows/hides input fields depending on chosen IPR phase (Liquid, Gas, Two-phase) and flow regime.  
   - Immediately flags out-of-range values (e.g., “Skin factor must be ≥ -7”).  
   - Options for “Spacing Method” (NumPoints, ΔP, ΔQ) let users define how the IPR curve is generated.

4. **Charting**  
   - Uses Chart.js to plot the resulting IPR curve.  
   - If gas calculations are selected, user sees either partial curves or known incomplete results until the equations are fully tested.

### Known Bugs & Limitations

1. **Overpressured Gas Reservoirs (> ~4500 psi)**  
   - Some z‐factor correlations (e.g., Dranchuk & Abou‐Kassem) can fail to converge or yield unrealistic \(z\) values above ~4500–5000 psia. This may cause the IPR curve to behave erratically. The team is investigating more stable solvers and iteration damping.  
   - Also, user must be mindful that certain correlations (e.g. Brill & Beggs) are only validated to ~15,000 psia, so results might be unreliable if the reservoir pressure exceeds that range.

2. **OPR / Vertical Lift**  
   - Not yet implemented. The user can compute only inflow performance. A full nodal analysis needs wellbore/outflow modeling.

3. **UI/UX**  
   - Some advanced error messages or tooltips not yet implemented.  
   - Additional PVT data or more complex fluid behaviors may not be fully handled.

### Roadmap

1. **Complete Gas IPR**  
   Finalize stable real‐gas correlations, especially for higher pressures. Add robust iteration methods for z.  
2. **Add OPR / Wellbore**  
   Introduce vertical lift performance, multiphase flow correlations, and choking models for a full nodal analysis solution.  
3. **Expand Validation & Unit Conversions**  
   More built‐in safety checks for extreme reservoir parameters. Increase the unit conversions for more specialized metrics.  
4. **Integration with Other IPPS Modules**  
   Merge with upcoming modules (e.g., decline‐curve, material balance) in a single user interface, ensuring consistent data management.

## How to Run Locally

1. **Clone** this repository:
   ```bash
   git clone https://github.com/your-org/ipps.git
