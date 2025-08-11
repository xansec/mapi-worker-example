package main

import (
	"fmt"
	"log"
	"net/http"
	"os/exec"
	"os"
	"strings"
)

func runMapi(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	// fetch data and strip whitespace
	workspace := strings.TrimSpace(r.FormValue("workspace"))
	project := strings.TrimSpace(r.FormValue("project"))
	target := strings.TrimSpace(r.FormValue("target"))
	api_url := strings.TrimSpace(r.FormValue("api_url"))
	api_spec := strings.TrimSpace(r.FormValue("api_spec"))
	duration := strings.TrimSpace(r.FormValue("duration"))

	if workspace == "" || project == "" || target == "" || api_url == "" || api_spec == "" || duration == "" {
		http.Error(w, "All fields are required!", http.StatusBadRequest)
		return
	}

	// Need to run /usr/local/bin/mapi run workspace/project/target duration api_spec --url api_url
	cmd := exec.Command("/usr/local/bin/mapi", "run", fmt.Sprintf("%s/%s/%s", workspace, project, target), duration, api_spec, "--url", api_url)

	// join full command into a single variable
	fullCommand := fmt.Sprintf("mapi run %s/%s/%s %s %s --url %s", workspace, project, target, duration, api_spec, api_url)

	// // Get the string value of the environment variable MAYHEM_TOKEN
	// // if it exists otherwise use an empty string
	// Note: this is all probably unnecessary, but helped with debugging
	mayhemToken := ""
	if token := os.Getenv("MAYHEM_TOKEN"); token != "" {
		mayhemToken = token
	}
	cmd.Env = append(cmd.Env, fmt.Sprintf("MAYHEM_TOKEN=%s", mayhemToken))

	output, err := cmd.CombinedOutput()
	if err != nil {
		http.Error(w, fmt.Sprintf("Token: %s\nCommand: %s\nFailed with: %s\nError: %s", mayhemToken, fullCommand, string(output), err), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "<html><body><h2>Command executed successfully!</h2><pre>%s</pre><a href='/'>Back</a></body></html>", output)
}

func main() {
	http.HandleFunc("/run", runMapi)

	log.Fatal(http.ListenAndServe(":8080", nil))
}
