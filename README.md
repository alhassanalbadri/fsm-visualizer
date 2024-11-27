# FSM Visualizer

Welcome to **FSM Visualizer**, a versatile tool for creating and visualizing finite state machines (FSMs). Whether you're designing complex parsers or simple state diagrams, this tool is built to enhance your workflow with ease and efficiency.

---

## 🎯 Features

- **No Registration Required**: Get started instantly—no signups or logins needed.
- **Flexible Customization**: Add detailed text to states and transitions for clarity.
- **Interactive Design**: Drag and drop states, connect transitions, and edit effortlessly.
- **Practical for Developers**: Built with ReactFlow, ensuring performance and scalability.

---

## 🚀 Live Demo

Try the tool live here: [Live Tool Link](https://alhassanalbadri.github.io/fsm-visualizer/)

---

## 🛠 Installation & Setup

Follow these steps to run the project locally:

1. **Clone the Repository**:
	```bash
	git clone https://github.com/yourusername/FSM-Visualizer.git
	cd FSM-Visualizer
	```

2. **Install Dependencies**:
	```bash
	npm install
	```

3. **Run the Development Server**:
	```bash
	npm run dev
	```

4. Open your browser and navigate to `http://localhost:3000`.

---

## 📂 Project Structure

- **Components**:
  - `CustomNode`: Customizable nodes for FSM states.
  - `CustomEdge`: Custom edges for transitions between states.
  - `Sidebar`: UI for adding and managing states and transitions.
- **State Management**:
  - Managed using ReactFlow's `useNodesState` and `useEdgesState`.

---

## 🤔 How to Use

1. **Add States**: Drag and drop new states from the sidebar onto the canvas.
2. **Connect Transitions**: Drag from one state to another to create transitions.
3. **Edit Labels**: Click on states or transitions to edit their labels.
4. **Save Your Work**: Take screenshots or copy the FSM structure for your needs.

---

## 🗺 Development Roadmap

### Stage 1: Basic Functionality
- [x] Implement basic pathfinding algorithm for FSMs
- [x] Add JSON export functionality
- [x] Add PNG export functionality

### Stage 2: LR(1) Grammar Integration
- [ ] Implement LR(1) grammar parsing
- [ ] Visualize LR(1) parser states and transitions
- [ ] Add support for grammar rule editing

### Stage 3: User Accounts and Basic Collaboration
- [ ] Implement user account creation and authentication
- [ ] Add basic collaboration features (e.g., sharing FSMs)
- [ ] Implement user-specific FSM storage

### Stage 4: Advanced Collaboration & Extensibility
- [ ] Add support for different FSM types
- [ ] Implement undo/redo functionality
... and more!

---

## 🛡 License

This project is licensed under the [MIT License](LICENSE).

---

## 🤝 Contributing

Contributions are welcome! If you have ideas for improvements or find bugs, please open an issue or submit a pull request.

---

## 📫 Feedback & Support

If you try out **FSM Visualizer**, let me know your thoughts! I'm always open to feedback and suggestions for improvement.

---

Happy visualizing! 🎉
