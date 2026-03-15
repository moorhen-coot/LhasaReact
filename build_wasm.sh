#!/usr/bin/sh

setcolor() {
    if [ -t 1 ]; then
        case $1 in
            red) echo -n "$(tput setaf 1)" ;;
            green) echo -n "$(tput setaf 2)" ;;
            yellow) echo -n "$(tput setaf 3)" ;;
            blue) echo -n "$(tput setaf 4)" ;;
            magenta) echo -n "$(tput setaf 5)" ;;
            cyan) echo -n "$(tput setaf 6)" ;;
            white) echo -n "$(tput setaf 7)" ;;
            reset) echo -n "$(tput sgr0)" ;;
        esac
    fi
}

if [ "x$LHASA_REACT_ROOT_DIR" = "x" ]; then
    # Based on '$0', i.e. the command being executed, finds the absolute path of where this script is located
    if command -v greadlink > /dev/null 2>&1; then
        LHASA_REACT_ROOT_DIR=`dirname -- "$( greadlink -f -- "$0"; )"`
    else
        LHASA_REACT_ROOT_DIR=`dirname -- "$( readlink -f -- "$0"; )"`
    fi
else
    setcolor green
    echo "Using LHASA_REACT_ROOT_DIR from environment: $LHASA_REACT_ROOT_DIR"
    setcolor reset
fi

: "${LHASA_WASM_BUILD_DIR:=${LHASA_REACT_ROOT_DIR}/wasm_build}"
: "${LHASA_WASM_OUTPUT_DIR:=${LHASA_WASM_BUILD_DIR}/output}"
COOT_LHASA_DIR="${LHASA_WASM_BUILD_DIR}/coot/lhasa"

export LHASA_MAIN_DIR="${COOT_LHASA_DIR}"
export DEPENDENCY_DIR="${LHASA_WASM_BUILD_DIR}/download"
export INSTALL_DIR="${LHASA_WASM_BUILD_DIR}/prefix"
export DEPENDENCY_BUILD_DIR="${LHASA_WASM_BUILD_DIR}/dep_build"
export LHASA_CMAKE_BUILD_DIR="${LHASA_WASM_BUILD_DIR}/lhasa_build"

fail() {
    setcolor red
    echo "Error: $1" >&2
    setcolor reset
}

if [ -f "$LHASA_REACT_ROOT_DIR/COOT_VERSION" ]; then
    . "$LHASA_REACT_ROOT_DIR/COOT_VERSION"
else
    fail "Could not find COOT_VERSION file in $LHASA_REACT_ROOT_DIR"
    exit 1
fi

cdbuilddir() {
    cd $LHASA_REACT_ROOT_DIR &&\
    mkdir -p ${LHASA_WASM_BUILD_DIR} &&\
    cd ${LHASA_WASM_BUILD_DIR} || fail "Could not setup / enter the build directory"
}

getcoot() {
    cdbuilddir
    if [ -r coot ]; then
        if [ "x$(git -C coot rev-parse --short=10 main)" = "x$coot_commit" ];then
            setcolor green
            echo "Using existing coot"
            setcolor reset
        else
            setcolor green
            echo "Checking-out existent coot to a different version ($(git -C coot rev-parse --short=10 main) -> $coot_commit)"
            setcolor reset
            git -C coot fetch &&\
            git -C coot checkout $coot_commit &&\
            echo Using checked-out coot || fail "Failed to checkout coot!"
        fi
    else
        setcolor green
        echo "Downloading hgonomeg/coot repo.."
        setcolor reset
        git clone --branch main https://github.com/hgonomeg/coot.git coot &&\
        git -C coot fetch origin &&\
        git -C coot checkout $coot_commit || fail "Failed to clone and checkout coot!"
    fi
    echo
}

copy_outputs() {
    mkdir -p $LHASA_WASM_OUTPUT_DIR &&\
    cp -v $LHASA_CMAKE_BUILD_DIR/lhasa.* $LHASA_WASM_OUTPUT_DIR/ 
}

do_deps() {
    setcolor green
    echo "Building Lhasa WASM dependencies with hgonomeg/coot commit=$coot_commit..."
    setcolor reset
    cdbuilddir
    # Coot sources get downloaded to $LHASA_WASM_BUILD_DIR/coot
    getcoot
    cd $COOT_LHASA_DIR || fail "Could not enter coot/lhasa directory"
    # Get dependency sources / verify sources are downloaded
    setcolor green
    echo "Downloading dependencies..."
    setcolor reset
    ./get_sources || fail "Failed to get dependency sources for Lhasa WASM build!"
    # Build dependencies into $INSTALL_DIR
    setcolor green
    echo "Building dependencies..."
    setcolor reset
    ./initial_build.sh || fail "Failed to build dependencies for Lhasa WASM build!"
}

do_build() {
    do_deps
    # Build Lhasa WASM module
    setcolor green
    echo "Building Lhasa WebAssembly module with hgonomeg/coot commit=$coot_commit..."
    setcolor reset
    cd $COOT_LHASA_DIR || fail "Could not enter coot/lhasa directory"
    ./build_lhasa.sh || fail "Failed to build Lhasa WebAssembly module!"
    # Copy outputs
    setcolor green
    echo "Copying Lhasa WebAssembly build outputs to $LHASA_WASM_OUTPUT_DIR/"
    setcolor reset
    copy_outputs
}



do_install() {
    setcolor green
    echo "Installing Lhasa WebAssembly module to public/ and src/ directories..."
    cp -v $LHASA_WASM_OUTPUT_DIR/lhasa.{js,wasm} $LHASA_REACT_ROOT_DIR/public/ &&\
    cp -v $LHASA_WASM_OUTPUT_DIR/lhasa.d.ts $LHASA_REACT_ROOT_DIR/src/ &&\
    echo "Installation successful!" || fail "Installation failed!"
    setcolor reset
}

case $1 in
    -h|--help)
        echo "This script is used for building the WebAssembly-part of Lhasa."
    ;;
    -i|--install)
        do_build
        do_install
    ;;
    -d|--dependencies-only)
        do_deps
    ;;
    *)
        if [ "x$1" = "x" ]; then
            do_build
        else
            setcolor red
            echo "Unknown argument: $1"
            setcolor reset
            echo "Use -h or --help for usage information."
        fi
    ;;
esac
