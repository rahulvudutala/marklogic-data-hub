/*
 * Copyright 2012-2018 MarkLogic Corporation
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */

package com.marklogic.gradle.task

import com.marklogic.gradle.DataHubPlugin
import com.marklogic.hub.DataHub
import com.marklogic.hub.deploy.commands.LoadUserStagingModulesCommand
import com.marklogic.hub.impl.DataHubImpl
import com.marklogic.rest.util.ResourcesFragment

import org.gradle.api.Project
import org.gradle.api.Task
import org.gradle.api.tasks.TaskAction

class GradleTasks extends HubTask {

    @TaskAction
    public void listGradleTasks() {
        Project currentUserProject = getProject()
        Map<String, List<Task>> dataHubTasks = new TreeMap<>()

        for(Task task : currentUserProject.getTasks()) {
            task.group = task.group != null ? task.group : "other"
            if(dataHubTasks.keySet().contains(task.group)) {
                List<Task> l = dataHubTasks.get(task.group)
                l.add(task)
                dataHubTasks.put(task.group, l)
            } else {
                List<Task> l = new ArrayList()
                l.add(task)
                dataHubTasks.put(task.group, l)
            }
        }

        //dataHubTasks = sortMapForIndentation(dataHubTasks)

        for(String dhfGroup : dataHubTasks.keySet()) {
            if(dhfGroup.equals("MarkLogic Data Hub Setup") || dhfGroup.equals("MarkLogic Data Hub Scaffolding") ||
                dhfGroup.equals("MarkLogic Data Hub Flow Management") || dhfGroup.equals("other") || 
                dhfGroup.equals("ml-gradle Deploy")) {
                int maxGroupLen = maxLenInGroup(dataHubTasks.get(dhfGroup))
                println(dhfGroup.substring(0, 1).toUpperCase() + dhfGroup.substring(1) + " tasks : ")
                println()
                for(Task task : dataHubTasks.get(dhfGroup)) {
                    String spaces = addSpaces(maxGroupLen - task.name.length())
                    println(task.name + spaces + "\t" + (task.description != null ? "- " + task.description : ""))
                }
                println()
                println()
            }
        }
    }

    //	private Map<String, List<Task>> sortMapForIndentation(Map<String, List<Task>> dataHubTasks) {
    //		for(String s : dataHubTasks.keySet()) {
    //			List<Task> l = dataHubTasks.get(s)
    //			Collections.sort(l, new Comparator<Task>() {
    //				@Override
    //				public int compare(Task t1, Task t2) {
    //					return t1.name.length() > t2.name.length() ? 1 : -1;
    //				}
    //			});
    //		}
    //		return dataHubTasks
    //	}

    private String addSpaces(int count) {
        StringBuilder sb = new StringBuilder();
        for(int i=0;i<count;i++) {
            sb.append(" ");
        }
        return sb.toString()
    }

    private int maxLenInGroup(List<Task> groupTasks) {
        int maxLen = 0
        for(Task task : groupTasks) {
            maxLen = task.name.length() > maxLen ? task.name.length() : maxLen
        }
        return maxLen;
    }
}