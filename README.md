# node-mp3fs

As the [most current mp3fs implementation](https://github.com/khenriks/mp3fs) maintained
by khenriks has severe performance issues when accessed through syncthing, this is an
attempt in creating a clone in a language familiar to me which implements caching
recently transcoded files in memory to speed up sequential accesses to chunks of
the same file.

**CURRENTLY NOT FUNCTIONAL**

## Authors

This program is developed by A. Ivashutin. 
Heavily inspired by [mp3fs](https://github.com/khenriks/mp3fs)
