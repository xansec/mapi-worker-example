package main

import (
	"fmt"
	"log"
	"net/http"
	"os/exec"
	"strings"
)

func mapiDiscover(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	api_url := strings.TrimSpace(r.FormValue("api_url"))

	if api_url == "" {
		http.Error(w, "API URL is required", http.StatusBadRequest)
		return
	}

	addl_opts := []string{}

	// Strip https:// or http:// from the URL
	prefixes := []string{"https://", "http://"}
	postfixes := []string{"/", "/v1", "/v2", "/v3", "/api", "/api/v1", "/api/v2", "/api/v3"}
	for _, prefix := range prefixes {
		if strings.HasPrefix(api_url, prefix) {
			api_url = strings.TrimPrefix(api_url, prefix)
			addl_opts = append(addl_opts, "--schemes", strings.TrimSuffix(prefix, "://"))
			break
		}
	}
	for _, postfix := range postfixes {
		if strings.HasSuffix(api_url, postfix) {
			api_url = strings.TrimSuffix(api_url, postfix)
			break
		}
	}
	cmd_array := []string{"discover", "--hosts", api_url, "--endpoints-file", "/endpoints.txt", "--output", "/discovery_results"}
	if len(addl_opts) > 0 {
		cmd_array = append(cmd_array, addl_opts...)
	}
	cmd := exec.Command("/usr/local/bin/mapi", cmd_array...)

	fullCommand := fmt.Sprintf("mapi %s", strings.Join(cmd_array, " "))

	output, err := cmd.CombinedOutput()
	if err != nil {
		http.Error(w, fmt.Sprintf("Command: %s\nFailed with: %s\nError: %s", fullCommand, string(output), err), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "<html><body><h2>Command executed successfully!</h2><pre>%s</pre><a href='/'>Back</a></body></html>", output)

	// List contents of /discovery_results
	results, err := exec.Command("readlink", "-f", "/discovery_results/*").CombinedOutput()
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to list discovery results: %s", err), http.StatusInternalServerError)
		return
	}
	fmt.Fprintf(w, "<h3>Discovery Results:</h3><pre>%s</pre>", results)

}

func mapiRun(w http.ResponseWriter, r *http.Request) {
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

	addl_opts := []string{}
	if r.FormValue("experimental") == "1" {
		addl_opts = append(addl_opts, "--experimental-rules")
	}
	if r.FormValue("verify") == "1" {
		addl_opts = append(addl_opts, "--verify-tls")
	}
	authType := strings.TrimSpace(r.FormValue("auth-type"))
	if authType == "None" {
		// do nothing
	} else {
		authValue := strings.TrimSpace(r.FormValue("auth-value"))
		if authValue == "" {
			http.Error(w, "Auth value is required for header authentication", http.StatusBadRequest)
			return
		}
		switch authType {
		case "Bearer", "Basic":
			addl_opts = append(addl_opts, "--header-auth", fmt.Sprintf("Authorization: %s %s", authType, authValue))
		case "Cookie":
			addl_opts = append(addl_opts, "--cookie-auth", authValue)
		}
	}

	if workspace == "" || project == "" || target == "" || api_url == "" || api_spec == "" || duration == "" {
		http.Error(w, "Some fields are missing!", http.StatusBadRequest)
		return
	}

	// Need to run /usr/local/bin/mapi run workspace/project/target duration api_spec --url api_url
	cmd_array := []string{"run", fmt.Sprintf("%s/%s/%s", workspace, project, target), duration, api_spec, "--url", api_url}
	if len(addl_opts) > 0 {
		cmd_array = append(cmd_array, addl_opts...)
	}
	cmd := exec.Command("/usr/local/bin/mapi", cmd_array...)

	// join full command into a single variable
	fullCommand := fmt.Sprintf("mapi %s", strings.Join(cmd_array, " "))

	output, err := cmd.CombinedOutput()
	if err != nil {
		http.Error(w, fmt.Sprintf("Command: %s\nFailed with: %s\nError: %s", fullCommand, string(output), err), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "<html><body><h2>Command executed successfully!</h2><pre>%s</pre><a href='/'>Back</a></body></html>", output)
}

func main() {
	http.HandleFunc("/run", mapiRun)
	http.HandleFunc("/discover", mapiDiscover)

	log.Fatal(http.ListenAndServe(":8080", nil))
}
