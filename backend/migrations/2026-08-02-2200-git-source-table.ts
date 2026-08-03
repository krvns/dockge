import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("git_source", (table) => {
        table.increments("id");
        table.string("stack_name", 255).notNullable().unique().collate("utf8_general_ci");
        table.string("url", 2000).notNullable();
        table.string("branch", 255).notNullable().defaultTo("main");
        table.datetime("created_at").defaultTo(knex.fn.now());
        table.datetime("updated_at").defaultTo(knex.fn.now());
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("git_source");
}
