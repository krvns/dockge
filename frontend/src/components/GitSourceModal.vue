<template>
    <BModal ref="modal" v-model="show" :title="$t('Add from Git')" :okTitle="isDone ? $t('Close') : $t('Clone')" :cancelTitle="$t('Cancel')" :hideCancel="isDone" @ok="isDone ? onHidden() : clone($event)" @hidden="onHidden" :busy="processing">
        <template #footer="{ ok, cancel }">
            <button v-if="!isDone" class="btn btn-secondary" @click="cancel()" :disabled="processing">{{ $t("Cancel") }}</button>
            <button v-if="!isDone" class="btn btn-primary" @click="clone($event)" :disabled="processing">
                <div v-if="processing" class="spinner-border spinner-border-sm me-1"></div>
                {{ $t("Clone") }}
            </button>
            <button v-else class="btn btn-primary" @click="cancel()">
                {{ $t("Close") }}
            </button>
        </template>

        <div class="mb-3">
            <label for="url" class="form-label">{{ $t("Git SSH URL") }}</label>
            <input id="url" v-model="url" type="text" class="form-control" required placeholder="git@github.com:user/repo.git" :disabled="processing || isDone">
            <div v-if="processing && progressText" class="form-text text-info mt-2" style="white-space: pre-wrap;">
                {{ progressText }}
            </div>
            <div v-if="isDone" class="mt-3">
                <div v-if="isSuccess" class="alert alert-success mb-0">
                    {{ $t("Clone successful.") }}
                </div>
                <div v-else class="alert alert-danger mb-0" style="white-space: pre-wrap; word-break: break-all;">
                    {{ $t("Clone failed:") }} {{ errorMsg }}
                </div>
            </div>
        </div>

        <hr />
        <h6 class="text-muted">{{ $t("Optional") }}</h6>

        <div class="mb-3">
            <label for="stackName" class="form-label">{{ $t("Stack Name") }}</label>
            <input id="stackName" v-model="stackName" type="text" class="form-control" :placeholder="$t('Extracted from URL if empty')" :disabled="processing || isDone">
        </div>
        
        <div class="mb-3">
            <label for="branch" class="form-label">{{ $t("Branch") }}</label>
            <input id="branch" v-model="branch" type="text" class="form-control" :placeholder="$t('Leave empty for default branch')" :disabled="processing || isDone">
        </div>
    </BModal>
</template>

<script>
export default {
    data() {
        return {
            show: false,
            processing: false,
            isDone: false,
            isSuccess: false,
            errorMsg: "",
            stackName: "",
            url: "",
            branch: "",
            progressText: "",
        };
    },
    mounted() {
        this.$root.getSocket().on("gitCloneProgress", (data) => {
            if (this.processing) {
                let lines = data.split(/[\r\n]+/);
                let lastLine = lines[lines.length - 1] || lines[lines.length - 2];
                if (lastLine && lastLine.trim()) {
                    this.progressText = lastLine.trim();
                }
            }
        });
    },
    beforeUnmount() {
        this.$root.getSocket().off("gitCloneProgress");
    },
    methods: {
        showModal() {
            this.show = true;
        },
        onHidden() {
            this.stackName = "";
            this.url = "";
            this.branch = "";
            this.processing = false;
            this.isDone = false;
            this.isSuccess = false;
            this.errorMsg = "";
            this.progressText = "";
        },
        clone(bvEvent) {
            if (bvEvent && typeof bvEvent.preventDefault === 'function') {
                bvEvent.preventDefault();
            }
            
            if (!this.url) {
                this.$toast.error(this.$t("Please provide a Git URL."));
                return;
            }

            let finalStackName = this.stackName.trim();
            if (!finalStackName) {
                const match = this.url.match(/\/([^\/]+)\.git$/) || this.url.match(/:([^\/:]+)\.git$/);
                if (match && match[1]) {
                    finalStackName = match[1];
                } else {
                    finalStackName = this.url.split('/').pop().replace('.git', '');
                }
                
                if (!finalStackName) {
                    this.$toast.error(this.$t("Could not extract stack name from URL. Please provide one manually."));
                    return;
                }
            }

            this.processing = true;
            this.progressText = this.$t("Cloning repository...");

            this.$root.getSocket().emit("addGitSource", this.url, finalStackName, this.branch, (res) => {
                this.processing = false;
                this.isDone = true;
                if (res.ok) {
                    this.isSuccess = true;
                    this.$emit("added");
                } else {
                    this.isSuccess = false;
                    this.errorMsg = res.msg;
                }
            });
        }
    }
}
</script>
