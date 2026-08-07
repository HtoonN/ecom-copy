<template>
    <v-row>
        <v-col v-if="search" cols="3" :order="search.item_order">
            <v-text-field 
                v-model="search_query"
                density="compact" 
                variant="outlined" 
                append-inner-icon="mdi-magnify"
                :placeholder="search.placeholder"
                color="primary"
                clearable
                @input="searchChanged"
            >
            </v-text-field>
        </v-col>
        <v-col>
            <slot name="top-bar"></slot>
        </v-col>
    </v-row>

    <v-data-table-server
        v-model:items-per-page="paginator.perPage"
        :headers="columns" 
        :items="paginator.data"
        :itemsLength="paginator.total"
        :loading="loading"
        class="elevation-1 mt-5">
        <template v-slot:bottom>
            <v-pagination 
                v-if="!data"
                v-model="pagination.page" 
                :length="pagination.lastPage"
                @next="updatePage"
                @prev="updatePage"
                 >
                <template v-slot:item="item">
                    <v-btn
                        :key="item"
                        fab
                        small
                        class="ma-2 elevation-0"
                        @click="updatePage(item.page)"
                        :color="pagination.page == item.page ? 'grey-lighten-2' : ''">
                        {{ item.page  }}
                    </v-btn>
                </template>
          </v-pagination>
        </template>

        <template v-for="column in columns" v-slot:[getSlotName(column)]="item">
            <slot :name="`build-${column.key}`" :item="item.item"></slot>
        </template>

        <template v-slot:item.action="item">
                <div v-if="item.column.key === 'action'">
                    <v-container class="d-flex flex-row">
                        <template v-for="action in item.column.actions">
                            <v-btn :color="action.color" @click="actionClicked(action.name, item.item)">
                                <v-icon color="white">{{ action.icon }}</v-icon>
                            </v-btn>
                        </template>
                    </v-container>
                </div>
        </template>
    </v-data-table-server>
</template>

<script>
export default {
    name: 'DataTable',
    props: {
        columns: {
            type: Array,
            required: true,
        },
        loading: {
            type: Boolean,
            default: false,
        },
        pagination:{
            type: Object,
            default: {
                data: [],
                page: 0,
                perPage: 0,
                total: 0,
                lastPage: 0,
            },
        },
        data: {
            type: Array,
        },
        search: {
            type: Object,
        },
    },
    emits: ['on-search', 'page-changed', 'edit', 'delete', 'view'],
    data() {
        return {
            search_query: '',
        }
    },
    computed:{
        paginator() {
            return this.data ? {
                data: this.data,
                page: 1,
                perPage: this.data.length,
                total: this.data.length,
                lastPage: 1,
            } : this.pagination
        }
    },
    methods: {
        actionClicked(action, item) {
            this.$emit(action, item)
        },
        getSlotName(column) {
            return column.is_build?`item.${column.key}`:null
        },
        searchChanged() {
            this.$emit('on-search', this.search_query)
        },
        updatePage(newPage) {
            this.pagination.page = parseInt(newPage)
            this.$emit('page-changed', newPage)
        }
    },
}
</script>

<style scoped>
.d-flex {
    gap: 1rem;
}
</style>
