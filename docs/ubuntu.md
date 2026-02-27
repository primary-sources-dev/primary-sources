# Enabling Full Agent Capabilities (Linux Subsystem)

To unlock full agent capabilities, including real-time browser rendering and automated screenshots, the project needs to run in a Linux environment. On Windows, this is most easily achieved using **WSL (Windows Subsystem for Linux)**.

## Why Migrate?
- **Unlocks Browser Subagent**: My internal browser tool is currently Linux-only. Moving to WSL allows me to "see" your site, capture mobile screenshots, and verify visual polish automatically.
- **Improved Tooling**: Linux provides a more consistent environment for build scripts, site generation, and CLI tools.

## Migration Steps (WSL/Ubuntu)

1.  **Install WSL/Ubuntu**:
    - Open PowerShell as Administrator and run: `wsl --install`
    - Restart your computer if prompted.
    - Set up your Ubuntu username and password when the terminal opens.

2.  **Clone the Project into Linux**:
    - Open your Ubuntu terminal.
    - Clone the repository:
      ```bash
      git clone https://github.com/primary-sources-dev/primary-sources.git ~/primary-sources
      ```

3.  **Connect your IDE (VS Code Example)**:
    - Click the **Green Remote Icon** in the bottom-left corner of VS Code.
    - Select **"Connect to WSL"** or **"WSL: Ubuntu-22.04"**.
    - Open the `~/primary-sources` folder.

4.  **Install Dependencies**:
    - Inside the WSL terminal, ensure you have Python/Node installed as needed:
      ```bash
      sudo apt update && sudo apt install python3 python3-pip
      ```

## The Workspace After Migration
Once connected via WSL, I will automatically detect the Linux environment and you will see "Antigravity Browser" enabled in my toolset. We can then perform high-fidelity visual audits together!
