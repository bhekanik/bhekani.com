type ProjectSource = {
  id: string
  data: {
    title: string
    description?: string
    url?: string
  }
}

export type ProjectSummary = ProjectSource["data"]

export function selectProjectSummaries(
  projects: readonly ProjectSource[],
  ids: readonly string[],
): ProjectSummary[] {
  const byId = new Map(projects.map((project) => [project.id, project.data]))

  return ids.map((id) => {
    const project = byId.get(id)

    if (!project) {
      throw new Error(`Missing project summary for ${id}`)
    }

    return project
  })
}
