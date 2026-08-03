<template>
    <BModal v-model="show" :title="$t('Add from Git')" :okTitle="$t('Clone')" @ok="clone" @hidden="onHidden">
        <div class="mb-3">
            <label for="stackName" class="form-label">{{ $t("Stack Name") }}</label>
            <input id="stackName" v-model="stackName" type="text" class="form-control" required placeholder="my-stack">
        </div>
        <div class="mb-3">
            <label for="url" class="form-label">{{ $t("Git SSH URL") }}</label>
            <input id="url" v-model="url" type="text" class="form-control" required placeholder="git@github.com:user/repo.git">
        </div>
        <div class="mb-3">
            <label for="branch" class="form-label">{{ $t("Branch") }}</label>
            <input id="branch" v-model="branch" type="text" class="form-control" placeholder="main">
        </div>
    </BModal>
</template>

<script>
export default {
    data() {
        return {
            show: false,
            stackName: "",
            url: "",
            branch: "main",
        };
    },
    methods: {
        showModal() {
            this.show = true;
        },
        onHidden() {
            this.stackName = "";
            this.url = "";
            this.branch = "main";
        },
        clone(bvEvent) {
            bvEvent.preventDefault();
            
            if (!this.stackName || !this.url) {
                this.$toast.error(this.$t("Please fill in required fields."));
                return;
            }

            this.$root.getSocket().emit("addGitSource", this.url, this.stackName, this.branch, (res) => {
                if (res.ok) {
                    this.$toast.success(this.$t("Git source cloned successfully."));
                    this.show = false;
                } else {
                    this.$toast.error(res.msg);
                }
            });
        }
    }
}
</script>
