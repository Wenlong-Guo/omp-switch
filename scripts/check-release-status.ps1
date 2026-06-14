param(
    [Parameter(Mandatory = $true)]
    [string]$Tag,

    [string]$Token = ""
)

$ErrorActionPreference = "Stop"

$Owner = "Wenlong-Guo"
$Repo = "omp-switch"
$ApiBase = "https://api.github.com/repos/$Owner/$Repo"
$GitHubBase = "https://github.com/$Owner/$Repo"

function New-Headers {
    $headers = @{
        "Accept" = "application/vnd.github+json"
        "User-Agent" = "omp-switch-release-status-check"
    }

    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }

    return $headers
}

function Test-RateLimited($Response) {
    if (-not $Response) { return $false }

    $remaining = $null
    if ($Response.Headers) {
        $remaining = $Response.Headers["X-RateLimit-Remaining"]
        if (-not $remaining) { $remaining = $Response.Headers["x-ratelimit-remaining"] }
    }

    return ($remaining -and "$remaining" -eq "0")
}

function Invoke-GitHubGet([string]$Url) {
    $result = [ordered]@{
        ok = $false
        status_code = $null
        rate_limited = $false
        body = $null
        error = $null
    }

    try {
        $response = Invoke-WebRequest -Uri $Url -Headers (New-Headers) -Method Get -UseBasicParsing
        $result.status_code = [int]$response.StatusCode

        if ($response.StatusCode -ne 200) {
            $result.rate_limited = Test-RateLimited $response
            return $result
        }

        $body = $response.Content | ConvertFrom-Json
        if ($body.PSObject.Properties.Name -contains "message") {
            $result.rate_limited = ($body.message -match "rate limit")
            $result.error = $body.message
            return $result
        }

        $result.ok = $true
        $result.body = $body
        return $result
    } catch {
        $result.error = $_.Exception.Message
        if ($_.Exception.Response) {
            $result.status_code = [int]$_.Exception.Response.StatusCode
            $result.rate_limited = Test-RateLimited $_.Exception.Response
        }
        return $result
    }
}

function Invoke-GitHubHead([string]$Url) {
    $result = [ordered]@{
        status_code = $null
        ok = $false
    }

    try {
        $response = Invoke-WebRequest -Uri $Url -Method Head -UseBasicParsing
        $result.status_code = [int]$response.StatusCode
        $result.ok = ($response.StatusCode -eq 200)
    } catch {
        if ($_.Exception.Response) {
            $result.status_code = [int]$_.Exception.Response.StatusCode
        }
    }

    return $result
}

function Get-NextAction($TagExists, $ReleasePublic, $ActionsStatus) {
    if (-not $TagExists) { return "Push tag to origin: git push origin $Tag" }
    if ($ActionsStatus -eq "in_progress") { return "Wait for GitHub Actions to finish." }
    if ($ActionsStatus -eq "failure") { return "Open the failed Actions run and fix the release workflow." }
    if ($ActionsStatus -eq "not_found") { return "Check whether the tag push triggered the release workflow." }
    if ($ReleasePublic -eq $true) { return "Release is public. No action needed." }
    if ($ReleasePublic -eq $false) { return "Create or publish the GitHub release for $Tag." }
    if ($ReleasePublic -eq "unknown_rate_limited" -or $ActionsStatus -eq "unknown_rate_limited") { return "Retry later or pass -Token with a GitHub PAT." }
    if ($ReleasePublic -eq "unknown_no_token" -or $ActionsStatus -eq "unknown_no_token") { return "Retry with -Token to avoid anonymous API limits." }
    return "Review tag, release, and Actions status manually."
}

$tagExists = $false
try {
    $remoteTags = & git ls-remote --tags origin $Tag 2>$null
    if ($LASTEXITCODE -eq 0 -and $remoteTags) {
        $tagExists = $true
    }
} catch {
    $tagExists = $false
}

$releasePublic = if ($Token) { $false } else { "unknown_no_token" }
$releaseUrl = ""
$releaseApi = Invoke-GitHubGet "$ApiBase/releases/tags/$Tag"

if ($releaseApi.ok) {
    $releasePublic = (-not [bool]$releaseApi.body.draft)
    if ($releaseApi.body.html_url) { $releaseUrl = $releaseApi.body.html_url }
} elseif ($releaseApi.rate_limited) {
    $releasePublic = "unknown_rate_limited"
} elseif ($releaseApi.status_code -eq 404) {
    $releasePublic = $false
} else {
    $releasePublic = if ($Token) { $false } else { "unknown_no_token" }
}

if ($releasePublic -eq "unknown_rate_limited" -or $releasePublic -eq "unknown_no_token") {
    $head = Invoke-GitHubHead "$GitHubBase/releases/tag/$Tag"
    if ($head.status_code -eq 200) {
        $releasePublic = $true
        $releaseUrl = "$GitHubBase/releases/tag/$Tag"
    } elseif ($head.status_code -eq 404) {
        $releasePublic = $false
    }
}

$actionsStatus = if ($Token) { "not_found" } else { "unknown_no_token" }
$actionsUrl = ""
$actionsApi = Invoke-GitHubGet "$ApiBase/actions/runs?event=push&branch=$Tag&per_page=1"

if ($actionsApi.ok) {
    if ($actionsApi.body.workflow_runs -and $actionsApi.body.workflow_runs.Count -gt 0) {
        $run = $actionsApi.body.workflow_runs[0]
        if ($run.html_url) { $actionsUrl = $run.html_url }

        if ($run.status -eq "completed") {
            if ($run.conclusion -eq "success") {
                $actionsStatus = "success"
            } else {
                $actionsStatus = "failure"
            }
        } else {
            $actionsStatus = "in_progress"
        }
    } else {
        $actionsStatus = "not_found"
    }
} elseif ($actionsApi.rate_limited) {
    $actionsStatus = "unknown_rate_limited"
} elseif (-not $Token) {
    $actionsStatus = "unknown_no_token"
} else {
    $actionsStatus = "not_found"
}

$output = [ordered]@{
    tag_exists = [bool]$tagExists
    release_public = $releasePublic
    actions_status = $actionsStatus
    actions_url = $actionsUrl
    release_url = $releaseUrl
    next_action = Get-NextAction $tagExists $releasePublic $actionsStatus
}

$output | ConvertTo-Json -Depth 5
