# IPPS (Introductory Petroleum Production Software) — v0.0.3

**IPPS** is an open-source suite of petroleum engineering tools. This package currently focuses on **Nodal Analysis** with a React front end and a TypeScript correlation core.

---

## What’s in this package

- **Nodal Analysis** for both **IPR** (inflow) and **OPR/VLP** (outflow) with an operating-point intersection.
- Front end in **React** with unit-aware inputs, live validation, and charting.
- Core correlations implemented in TypeScript under `/Correlations`:
  - `GasCorrelations.ts` (z-factor, gas viscosity, etc.)
  - `OilCorrelations.ts` (solution GOR, Bo, μo, etc.)

---

## New in v0.0.3

- **OPR / Vertical Lift (initial release)**
  - Single-phase **oil** and **gas** tubing lift wired into the UI.
  - **Friction model selector** with Fanning factor from model:
    - Chen (1979), Swamee–Jain, Colebrook–White.
  - **Relative roughness (ε/D)** replaces absolute roughness; dimensionless and unit-agnostic.

- **Two-Phase IPR (complete)**
  - Two-phase **IPR** calculations are implemented and selectable in the UI.
  - **Two-phase OPR** remains on the **to-do** list (see Roadmap).

- **Units & Defaults**
  - **Oilfield/Imperial**: Tubing ID defaults to **inches**; **SI**: **centimeters**.
  - **Oil density input behavior**:
    - When **Oilfield/Imperial** units are active, **IPR and OPR for oil use API gravity** (°API). The app converts to density in the background for all correlations/pressure-loss calcs.
    - In **SI**, the form requests **density** directly (with optional °API helper planned).
  - All IPR/OPR inputs and labels are left-aligned for consistency.

- **Gas property engine & options**
  - z-factor methods exposed via dropdown and mapped internally:
    - Dranchuk & Abou-Kassem (1975), Dranchuk–Purvis–Robinson (1974),
    - Hall & Yarborough (1974), Redlich–Kwong (1949), Brill & Beggs (1974),
    - Chart interpolation helper.
  - `gas_visc_PT` and `z_PT` are available to IPR/OPR where needed.

- **Quality of life**
  - IPR curve generation correctly orders points from **high pwf → low pwf**.
  - Field-by-field validation tightened with immediate messages.

---

## Current capabilities

1. **IPR**
   - **Liquid (oil)**: Transient, Pseudosteady-State, Steady-State.
   - **Gas**: Transient / PSS / SS scaffolding with real-gas handling via selected z-method.
   - **Two-phase**: Implemented for IPR.
   - **Curve spacing:** NumPoints, ΔP, or ΔQ.

2. **OPR / Vertical Lift**
   - **Single-phase oil & gas** tubing lift with user-selectable friction model.
   - Inputs include ε/D (relative roughness), tubing ID, length, and surface/WH pressure.
   - **Two-phase OPR** is **not** yet available (see Roadmap).

3. **Units & Inputs**
   - **Oilfield/Imperial**: °API for oil; app converts to density internally.
   - **SI**: density provided directly.
   - Unit conversions via `UnitConverter` and `unitSystems.json`.

4. **UI & Validation**
   - Phase-aware forms (Liquid, Gas, Two-phase) with dynamic field visibility.
   - Inline errors with min/max hints and sensible defaults.

5. **Charting**
   - IPR and OPR curves displayed together; **operating point** highlighted when found.

---

## Known issues & limitations

- **High-pressure gas (≳ 4,500–5,000 psia):** some z-methods can be sensitive/unstable. Validate results outside published ranges; damping/robust solvers are being added.
- **Two-phase OPR:** not yet implemented.
- **UX polish:** advanced tooltips/guides pending.

---

## Roadmap

1. **Gas IPR hardening**
   - More stable z-solvers and fallback strategies at high Ppr.

2. **Two-phase lift (OPR)**
   - Add multiphase correlations and choke models for full-field VLP.

3. **Units & ergonomics**
   - Add °API↔density helper in SI; broaden guardrails for extreme inputs.

4. **Data export & reproducibility**
   - Export curves/operating point as CSV/JSON; embed run metadata.

---

## Project layout (high level)



## How to Run Locally

1. **Clone** this repository:
   ```bash
   git clone https://github.com/your-org/ipps.git
