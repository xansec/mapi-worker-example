package main

import (
	"fmt"
	"log"
	"net/http"
	"os/exec"
)

func runMapi(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	workspace := r.FormValue("workspace")
	project := r.FormValue("project")
	target := r.FormValue("target")
	api_url := r.FormValue("api_url")
	api_spec := r.FormValue("api_spec")
	duration := r.FormValue("duration")

	if workspace == "" || project == "" || target == "" || api_url == "" || api_spec == "" || duration == "" {
		http.Error(w, "All fields are required!", http.StatusBadRequest)
		return
	}

	cmd := exec.Command("mapi", "run", fmt.Sprintf("%s/%s/%s %s %s --url %s", workspace, project, target, duration, api_spec, api_url))
	output, err := cmd.CombinedOutput()
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to execute command: %s", err), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "<html><body><h2>Command executed successfully!</h2><pre>%s</pre><a href='/'>Back</a></body></html>", output)
}

func main() {
	http.HandleFunc("/run", runMapi)

	log.Fatal(http.ListenAndServe(":8080", nil))
}
