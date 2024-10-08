// source: https://github.com/grafana/tempo-operator/blob/4ec7e8b4cb102f52de1e101174f4490b1505eaa1/internal/manifests/naming/sanitize.go
package proxy

import (
	"regexp"
	"strings"
	"unicode/utf8"
)

var (
	dnsRegexp = regexp.MustCompile(`[a-z0-9]`)
)

// DNSName returns a dns-safe string for the given name.
// Any char that is not [a-z0-9] is replaced by "-" or "a".
// Replacement character "a" is used only at the beginning or at the end of the name.
// The function does not change length of the string.
func DNSName(name string) string {
	var d []rune

	for i, x := range strings.ToLower(name) {
		if dnsRegexp.Match([]byte(string(x))) {
			d = append(d, x)
		} else {
			if i == 0 || i == utf8.RuneCountInString(name)-1 {
				d = append(d, 'a')
			} else {
				d = append(d, '-')
			}
		}
	}

	return string(d)
}
