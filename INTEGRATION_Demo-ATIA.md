# Integration summary for the creation of demo-ATIA

## GPII-APP repository

1. Created initial branch based on current Astea's PR for PCP.
```
$ git fetch upstream refs/pull/27/head:PCP
```

where, upstream is:
```
upstream	git@github.com:GPII/gpii-app.git (fetch)
upstream	git@github.com:GPII/gpii-app.git (push)
```

Saved PR as new branch "PCP" https://github.com/gloob/gpii-app/tree/PCP

PCP:head is 575cd002ea4d918234c4196c31416889aaba0a10

2. Created base branch for the integration of the demo-ATIA
```
$ git checkout -b demo-ATIA
```
from the PCP branch.

## GPII Windows repository

1. Created initial branch based on windows#hst-2017, saved as gloob#demo-ATIA
2. Updated package.json to point to the new location.

## GPII Universal repository

## Non merged PRs

