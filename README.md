# 🌟 **FSM Visualizer** 🌟

Welcome to **FSM Visualizer**, your ultimate tool for crafting and visualizing finite state machines (FSMs). Whether you're designing a simple state diagram or tackling complex workflows, **FSM Visualizer** empowers you with intuitive and efficient tools. 🚀

---

## 🎯 **Features at a Glance**

- **🚪 No Signups Needed**: Start building instantly—no barriers or distractions.
- **✨ Fully Customizable**: Add detailed labels to states and transitions to bring clarity to your diagrams.
- **⚡ Interactive Interface**: Create, edit, and connect states seamlessly with drag-and-drop functionality.
- **🛠 Built from Scratch**: Powered by a custom implementation designed for maximum flexibility and performance.
- **🔧 Tools Section**: Transform **BNF grammar into FSM** representations in **LR(1) parser form**, making it perfect for advanced grammar analysis and parsing tasks.

---

## 🌐 **Live Demo**

Explore the magic now: 👉 [**FSM Visualizer Live**](https://alhassanalbadri.github.io/fsm-visualizer/) 🎉

---

## 🛠 **Getting Started**

Ready to run **FSM Visualizer** locally? Just follow these simple steps:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/alhassanalbadri/fsm-visualizer.git
   cd FSM-Visualizer
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:3000`. 🎉

---

## 📂 **Project Structure**

Here's an overview of the key components:

- **🎨 Components**:
  - `CustomNode`: The visual representation of FSM states with editable labels.
  - `CustomEdge`: Flexible transitions connecting the states.
  - `FSMHandler`: The core logic for managing states and transitions.
  - `Sidebar`: The sidebar for adding new states, and accessing our builtin tools.
- **🔧 State Management**:
  - Built from scratch to ensure efficient and intuitive interaction.
  - Handles all nodes, edges, and user interactions dynamically.

---

## 🤔 **How to Use**

1. **🎨 Add States**: Drag and drop new states from the sidebar onto the canvas.
2. **🔗 Connect Transitions**: Click and drag from one state to another.
3. **🖊 Edit Labels**: Double-click on states or transitions to update their labels.
4. **📷 Save Your Work**: Export your FSM as JSON, PNG, or SVG to share or reuse.
5. **🔧 Tools Section**: Use the **BNF grammar to FSM** tool to visualize LR(1) parser states from your grammar inputs.

---

## 🗺 **Development Roadmap**

### 🔹 Stage 1: Core Features
- [x] Custom-built state and edge management
- [x] JSON import/export functionality
- [x] PNG/SVG export support
- [ ] Multiple node types (e.g., start/end states)

### 🔹 Stage 2: Grammar Integration
- [x] **BNF grammar to FSM** in LR(1) parser form
- [x] Visualization of LR(1) parser states

### 🔹 Stage 3: Styling & Customization
- [ ] Customizable colors for states and edges
- [ ] Enhanced edge styles and animations
- [ ] Customizable end markers for transitions

### 🔹 Stage 4: Collaboration
- [ ] User account creation and authentication
- [ ] Shared FSM editing and real-time collaboration
- [ ] Personal dashboards for managing FSMs

### 🔹 Stage 5: Advanced Features
- [ ] Support for diverse FSM types
- [ ] Undo/redo functionality
- [ ] Composite nodes for advanced workflows

---

## ⚠️ **Known Issues**

### Current Issues
- **PNG/SVG Export Flicker**: A flicker occurs during canvas rendering (Low priority).
- **Oversized Node Boxes**: Some nodes initially have unnecessary padding (Low priority).

---

## 🛡 **License**

This project is open-source and available under the [MIT License](LICENSE). 📝

---

## 🤝 **Contributing**

Let’s make **FSM Visualizer** even better! 💡  
If you have ideas or find bugs, feel free to open an issue or submit a pull request. Contributions are always welcome! 🙌

---

## 📢 **Feedback & Support**

Tried **FSM Visualizer**? Share your thoughts or suggestions!  
Your feedback helps us grow and improve. 💬

---

🎉 **Happy Visualizing!** 🎉  